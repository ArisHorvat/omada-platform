using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.DTOs.Organizations;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Infrastructure.Scraping;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ScrapedScheduleApplyService : IScrapedScheduleApplyService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContext _userContext;
    private readonly IUnitOfWork _uow;
    private readonly IScrapedEntityResolutionService _resolution;
    private readonly IScrapedHostAliasService _hostAliases;

    private static readonly Regex TrailingParenType = new(
        @"\s*\([^)]*\)\s*$",
        RegexOptions.Compiled);

    public ScrapedScheduleApplyService(
        ApplicationDbContext context,
        IUserContext userContext,
        IUnitOfWork uow,
        IScrapedEntityResolutionService resolution,
        IScrapedHostAliasService hostAliases)
    {
        _context = context;
        _userContext = userContext;
        _uow = uow;
        _resolution = resolution;
        _hostAliases = hostAliases;
    }

    public async Task<ServiceResponse<ApplyScrapedSchedulePreviewResultDto>> PreviewApplyAsync(
        ApplyScrapedScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        var build = await BuildApplyPlanAsync(request, cancellationToken);
        if (!build.IsSuccess)
            return new ServiceResponse<ApplyScrapedSchedulePreviewResultDto>(false, null, build.Error);

        return new ServiceResponse<ApplyScrapedSchedulePreviewResultDto>(true, build.Data!.ToPreview());
    }

    public async Task<ServiceResponse<ApplyScrapedScheduleResultDto>> ApplyAsync(
        ApplyScrapedScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        var build = await BuildApplyPlanAsync(request, cancellationToken);
        if (!build.IsSuccess)
            return new ServiceResponse<ApplyScrapedScheduleResultDto>(false, null, build.Error);

        var plan = build.Data!;
        var orgId = _userContext.OrganizationId;
        plan.Entity.WeeklySessionPlanJson = OfferingSessionPlanJson.Serialize(plan.ResultSessions);
        _uow.Repository<CourseOffering>().Update(plan.Entity);

        var derivedInstructors = OfferingSessionPlanSync.DeriveInstructorInputs(
            plan.ResultSessions,
            plan.Entity.HostId);
        if (derivedInstructors.Count > 0)
        {
            await OfferingInstructorSync.SyncAsync(
                _context,
                orgId,
                plan.Entity.Id,
                derivedInstructors,
                plan.Entity.HostId,
                cancellationToken);
        }

        await OfferingPackageActivitySync.SyncMatchingPackageItemsAsync(
            _context,
            orgId,
            plan.Entity.Name,
            plan.ResultSessions,
            plan.Entity.Code,
            cancellationToken);

        await _uow.CompleteAsync();

        await _hostAliases.PersistProfessorMappingsAsync(orgId, request.Mappings, cancellationToken);

        var preview = plan.ToPreview();
        return new ServiceResponse<ApplyScrapedScheduleResultDto>(true, new ApplyScrapedScheduleResultDto
        {
            ProposedSessions = preview.ProposedSessions,
            Skipped = preview.Skipped,
            MatchedEventCount = preview.MatchedEventCount,
            ExistingSessionCount = preview.ExistingSessionCount,
            ResultSessionCount = preview.ResultSessionCount,
            Applied = true,
            OfferingId = plan.Entity.Id,
        });
    }

    private async Task<ServiceResponse<ApplyPlan>> BuildApplyPlanAsync(
        ApplyScrapedScheduleRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Events.Count == 0)
        {
            return Fail<ApplyPlan>(ErrorCodes.InvalidInput, "No scraped sessions to apply.");
        }

        var orgId = _userContext.OrganizationId;
        var entity = await _context.CourseOfferings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                o => o.Id == request.OfferingId
                     && o.OrganizationId == orgId
                     && o.PeriodId == request.PeriodId
                     && !o.IsDeleted,
                cancellationToken);

        if (entity == null)
            return Fail<ApplyPlan>(ErrorCodes.NotFound, "Course offering not found for this period.");

        var tracked = await _uow.Repository<CourseOffering>().GetQueryable()
            .FirstOrDefaultAsync(
                o => o.Id == request.OfferingId && o.OrganizationId == orgId && !o.IsDeleted,
                cancellationToken);

        if (tracked == null)
            return Fail<ApplyPlan>(ErrorCodes.NotFound, "Course offering not found.");

        var implicitCourse = request.ImplicitCourseName?.Trim();
        if (string.IsNullOrWhiteSpace(implicitCourse) && request.ImportAllScopedRows)
            implicitCourse = tracked.Name;

        var enriched = ScrapedScheduleRowEnricher.EnrichRows(
            ScrapedScheduleNormalizer.EnrichAll(request.Events),
            implicitCourse);
        var maps = await _resolution.BuildMapsAsync(orgId, enriched, cancellationToken);
        var hostAliasMap = ScrapedHostAliasJson.IndexByLabel(
            await _hostAliases.GetAliasesForOrgAsync(orgId, cancellationToken));
        var eventTypes = await _context.EventTypes
            .AsNoTracking()
            .Where(t => t.OrganizationId == orgId && !t.IsDeleted)
            .ToListAsync(cancellationToken);

        var cohortIds = await ResolveCohortGroupIdsAsync(orgId, request, cancellationToken);
        var packageTemplates = await LoadPackageActivityTemplatesAsync(orgId, tracked.Name, cancellationToken);

        var existing = OfferingSessionPlanJson.Parse(tracked.WeeklySessionPlanJson).ToList();
        var proposed = new List<OfferingWeeklySessionDto>();
        var skipped = new List<ScrapedScheduleApplySkipDto>();
        var matched = 0;

        foreach (var row in enriched)
        {
            if (!request.ImportAllScopedRows && !RowAppliesToOffering(row, tracked, request.Mappings))
                continue;

            matched++;
            if (!row.TimeParsed || row.DayOfWeek is null or < 0 or > 6 || string.IsNullOrWhiteSpace(row.StartTimeLocal))
            {
                skipped.Add(new ScrapedScheduleApplySkipDto
                {
                    ClassName = row.ClassName,
                    Time = row.Time,
                    Reason = row.TimeParseWarning ?? "Could not parse day and time.",
                });
                continue;
            }

            var activity = ScrapedScheduleRowEnricher.NormalizeActivityLabel(
                NormalizeActivity(row.ActivityType, row.ClassName));
            var type = ResolveEventType(eventTypes, activity, request.Mappings);
            ResolveHosts(row, maps, request.Mappings, hostAliasMap, out var hostId, out var hostName, out var coInstructorIds);
            ResolveRoom(row, maps, request.Mappings, out var roomId, out var roomName);
            var rowCohortIds = ResolveCohortIdsForRow(row, request, cohortIds);

            proposed.Add(new OfferingWeeklySessionDto
            {
                EventTypeId = type?.Id,
                EventTypeName = type?.Name ?? activity,
                HoursPerSession = row.HoursPerSession is > 0 ? row.HoursPerSession.Value : 2m,
                Frequency = string.IsNullOrWhiteSpace(row.Frequency) ? "weekly" : row.Frequency!,
                BiweeklyPhase = row.BiweeklyPhase,
                SortOrder = proposed.Count,
                DayOfWeek = row.DayOfWeek,
                StartTimeLocal = row.StartTimeLocal,
                HostId = hostId,
                HostName = hostName,
                AssignedInstructorIds = coInstructorIds,
                AudienceScope = rowCohortIds.Count > 0 ? "selected" : "all",
                CohortGroupIds = rowCohortIds.Count > 0 ? rowCohortIds : null,
                CohortDelivery = "split",
                RoomId = roomId,
                RoomName = roomName,
            });
        }

        if (matched == 0)
        {
            var hint = request.ImportAllScopedRows
                ? "Enable “Import all scoped rows” only when the scrape matches one offering, or pick a different offering."
                : "No scraped rows matched this offering by course name. Try “Import all scoped rows” for a single-course page, or adjust mappings.";
            return Fail<ApplyPlan>(ErrorCodes.InvalidInput, hint);
        }

        if (proposed.Count == 0)
        {
            return Fail<ApplyPlan>(
                ErrorCodes.InvalidInput,
                "Matched rows exist but none had parseable day/time. Fix unparsed rows first.");
        }

        var result = OfferingSessionPlanConsolidation.ApplyScrapeImport(
            existing,
            proposed,
            packageTemplates,
            request.ReplaceExistingSessions);

        return new ServiceResponse<ApplyPlan>(true, new ApplyPlan
        {
            Entity = tracked,
            ProposedSessions = result,
            Skipped = skipped,
            MatchedEventCount = matched,
            ExistingSessions = existing,
            ResultSessions = result,
        });
    }

    private async Task<IReadOnlyList<OfferingWeeklySessionDto>> LoadPackageActivityTemplatesAsync(
        Guid orgId,
        string offeringName,
        CancellationToken cancellationToken)
    {
        var trimmed = offeringName.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            return Array.Empty<OfferingWeeklySessionDto>();

        var items = await _context.CourseOfferingPackageItems.AsNoTracking()
            .Where(i => i.OrganizationId == orgId && !i.IsDeleted)
            .Select(i => new { i.Name, i.WeeklySessionPlanJson })
            .ToListAsync(cancellationToken);

        var match = items.FirstOrDefault(i =>
            string.Equals(i.Name.Trim(), trimmed, StringComparison.OrdinalIgnoreCase));

        if (match == null)
            return Array.Empty<OfferingWeeklySessionDto>();

        return OfferingSessionPlanJson.NormalizePackageActivities(
            OfferingSessionPlanJson.Parse(match.WeeklySessionPlanJson).ToList());
    }

    private static List<Guid> ResolveCohortIdsForRow(
        ScrapedEventDto row,
        ApplyScrapedScheduleRequest request,
        IReadOnlyList<Guid> fallbackCohortIds)
    {
        var mappings = request.Mappings?.StudyGroupToGroupId;
        var labels = new[]
        {
            row.GroupNumber?.Trim(),
            request.StudyGroupLabel?.Trim(),
        };

        foreach (var label in labels)
        {
            if (string.IsNullOrWhiteSpace(label))
                continue;

            if (mappings != null
                && mappings.TryGetValue(label, out var mapped)
                && mapped.HasValue)
            {
                return new List<Guid> { mapped.Value };
            }
        }

        return fallbackCohortIds.ToList();
    }

    private async Task<List<Guid>> ResolveCohortGroupIdsAsync(
        Guid orgId,
        ApplyScrapedScheduleRequest request,
        CancellationToken cancellationToken)
    {
        var ids = new List<Guid>();
        var mappings = request.Mappings?.StudyGroupToGroupId;

        if (!string.IsNullOrWhiteSpace(request.StudyGroupLabel)
            && mappings != null
            && mappings.TryGetValue(request.StudyGroupLabel.Trim(), out var mappedScope)
            && mappedScope.HasValue)
        {
            ids.Add(mappedScope.Value);
            return ids;
        }

        if (string.IsNullOrWhiteSpace(request.StudyGroupLabel))
            return ids;

        var label = request.StudyGroupLabel.Trim();
        var labelLower = label.ToLowerInvariant();

        var groups = await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted && GroupTypes.IsStudentGroup(g.Type))
            .Select(g => new { g.Id, g.Name })
            .ToListAsync(cancellationToken);

        var exact = groups.FirstOrDefault(g =>
            string.Equals(g.Name, label, StringComparison.OrdinalIgnoreCase));

        if (exact != null)
            return new List<Guid> { exact.Id };

        var contains = groups
            .Where(g =>
                (g.Name?.Contains(label, StringComparison.OrdinalIgnoreCase) ?? false)
                || labelLower.Contains((g.Name ?? string.Empty).Trim().ToLowerInvariant()))
            .Select(g => g.Id)
            .Distinct()
            .Take(8)
            .ToList();

        return contains;
    }

    private static EventType? ResolveEventType(
        IReadOnlyList<EventType> types,
        string activity,
        ScrapedImportMappingsDto? mappings)
    {
        if (mappings?.ActivityTypeToEventTypeId.TryGetValue(activity, out var mappedId) == true
            && mappedId.HasValue)
        {
            return types.FirstOrDefault(t => t.Id == mappedId.Value);
        }

        return MatchEventType(types, activity);
    }

    private static void ResolveHosts(
        ScrapedEventDto row,
        ScrapedEventResolutionMaps maps,
        ScrapedImportMappingsDto? userMappings,
        IReadOnlyDictionary<string, ScrapedHostAliasDto> hostAliases,
        out Guid? hostId,
        out string? hostName,
        out List<Guid>? coInstructorIds)
    {
        hostId = null;
        hostName = null;
        coInstructorIds = null;

        var raw = (row.Professor ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            return;

        var parts = ScrapedScheduleRowEnricher.SplitProfessorLabels(raw).ToList();
        if (parts.Count == 0)
            parts.Add(raw);

        var resolvedIds = new List<Guid>();
        var pendingNames = new List<string>();

        foreach (var part in parts)
        {
            ResolveHostPart(part, maps, userMappings, hostAliases, out var partId, out var partName);
            if (partId.HasValue)
            {
                if (!resolvedIds.Contains(partId.Value))
                    resolvedIds.Add(partId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(partName) && !pendingNames.Contains(partName, StringComparer.OrdinalIgnoreCase))
            {
                pendingNames.Add(partName);
            }
        }

        if (resolvedIds.Count > 0)
        {
            hostId = resolvedIds[0];
            if (resolvedIds.Count > 1)
                coInstructorIds = resolvedIds.Skip(1).ToList();
        }

        hostName = pendingNames.Count > 0
            ? string.Join(" · ", pendingNames)
            : raw;
    }

    private static void ResolveHostPart(
        string label,
        ScrapedEventResolutionMaps maps,
        ScrapedImportMappingsDto? userMappings,
        IReadOnlyDictionary<string, ScrapedHostAliasDto> hostAliases,
        out Guid? hostId,
        out string? hostName)
    {
        hostId = null;
        hostName = string.IsNullOrWhiteSpace(label) ? null : label.Trim();
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (userMappings?.ProfessorToHostId.TryGetValue(label, out var mapped) == true && mapped.HasValue)
        {
            hostId = mapped;
            hostName = null;
            return;
        }

        if (ScrapedHostAliasJson.TryGetByLabel(hostAliases, label, out var alias)
            && alias?.HostUserId is { } aliasHostId
            && aliasHostId != Guid.Empty)
        {
            hostId = aliasHostId;
            hostName = null;
            return;
        }

        maps.HostByProfessorKey.TryGetValue(NormalizeKeyPart(label), out hostId);
        if (hostId.HasValue)
        {
            hostName = null;
            return;
        }

        if (userMappings != null
            && userMappings.ProfessorToDisplayName.TryGetValue(label, out var displayOverride)
            && !string.IsNullOrWhiteSpace(displayOverride))
        {
            hostName = displayOverride.Trim();
        }
    }

    private static void ResolveRoom(
        ScrapedEventDto row,
        ScrapedEventResolutionMaps maps,
        ScrapedImportMappingsDto? userMappings,
        out Guid? roomId,
        out string? roomName)
    {
        roomId = null;
        roomName = string.IsNullOrWhiteSpace(row.Room) ? null : row.Room.Trim();
        var label = (row.Room ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (userMappings?.RoomToRoomId.TryGetValue(label, out var mapped) == true && mapped.HasValue)
        {
            roomId = mapped;
            return;
        }

        maps.RoomByRoomTextKey.TryGetValue(NormalizeKeyPart(label), out roomId);
    }

    private static bool RowAppliesToOffering(
        ScrapedEventDto row,
        CourseOffering offering,
        ScrapedImportMappingsDto? mappings)
    {
        if (EventMatchesOffering(row, offering))
            return true;

        if (mappings?.SubjectToOfferingId == null || mappings.SubjectToOfferingId.Count == 0)
            return false;

        foreach (var (scrapedLabel, mappedOfferingId) in mappings.SubjectToOfferingId)
        {
            if (!mappedOfferingId.HasValue || mappedOfferingId.Value != offering.Id)
                continue;
            if (RowSubjectMatchesLabel(row, scrapedLabel))
                return true;
        }

        return false;
    }

    private static bool RowSubjectMatchesLabel(ScrapedEventDto row, string scrapedLabel)
    {
        if (string.IsNullOrWhiteSpace(scrapedLabel))
            return false;

        var label = scrapedLabel.Trim();
        var className = (row.ClassName ?? string.Empty).Trim();
        if (string.Equals(className, label, StringComparison.OrdinalIgnoreCase))
            return true;

        var normalizedClass = NormalizeSubject(row.ClassName);
        var normalizedLabel = NormalizeSubject(label);
        if (string.IsNullOrWhiteSpace(normalizedClass) || string.IsNullOrWhiteSpace(normalizedLabel))
            return false;

        return normalizedClass.Contains(normalizedLabel, StringComparison.OrdinalIgnoreCase)
               || normalizedLabel.Contains(normalizedClass, StringComparison.OrdinalIgnoreCase);
    }

    private static bool EventMatchesOffering(ScrapedEventDto row, CourseOffering offering)
    {
        var subject = NormalizeSubject(row.ClassName);
        if (string.IsNullOrWhiteSpace(subject))
            return false;

        var name = NormalizeSubject(offering.Name);
        var code = NormalizeSubject(offering.Code ?? string.Empty);

        if (!string.IsNullOrWhiteSpace(code)
            && (subject.Contains(code, StringComparison.OrdinalIgnoreCase)
                || code.Contains(subject, StringComparison.OrdinalIgnoreCase)))
            return true;

        return subject.Contains(name, StringComparison.OrdinalIgnoreCase)
               || name.Contains(subject, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeSubject(string? value)
    {
        var t = TrailingParenType.Replace(value ?? string.Empty, string.Empty).Trim();
        return string.Join(' ', t.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }

    private static string NormalizeActivity(string activityType, string className)
    {
        var t = (activityType ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(t))
            return t;

        var match = Regex.Match(className ?? string.Empty, @"\(([^)]+)\)\s*$");
        return match.Success ? match.Groups[1].Value.Trim() : "Session";
    }

    private static EventType? MatchEventType(IReadOnlyList<EventType> types, string activity)
    {
        var a = activity.ToLowerInvariant();
        string[] keywords = a switch
        {
            var s when s.Contains("laborator") => new[] { "lab", "laborator" },
            var s when s.Contains("seminar") => new[] { "seminar" },
            var s when s.Contains("curs") => new[] { "curs", "lecture", "course" },
            var s when s.Contains("proiect") => new[] { "proiect", "project" },
            var s when s.Contains("consult") => new[] { "consult" },
            var s when s.Contains("practic") => new[] { "practic", "practice" },
            _ => new[] { a },
        };

        foreach (var key in keywords)
        {
            var hit = types.FirstOrDefault(t => t.Name.Contains(key, StringComparison.OrdinalIgnoreCase));
            if (hit != null)
                return hit;
        }

        return types.FirstOrDefault();
    }

    private static string NormalizeKeyPart(string? value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();

    private static ServiceResponse<T> Fail<T>(string code, string message) =>
        new(false, default, new AppError(code, message));

    private sealed class ApplyPlan
    {
        public required CourseOffering Entity { get; init; }

        public required List<OfferingWeeklySessionDto> ProposedSessions { get; init; }

        public required List<ScrapedScheduleApplySkipDto> Skipped { get; init; }

        public required int MatchedEventCount { get; init; }

        public required List<OfferingWeeklySessionDto> ExistingSessions { get; init; }

        public required List<OfferingWeeklySessionDto> ResultSessions { get; init; }

        public ApplyScrapedSchedulePreviewResultDto ToPreview() => new()
        {
            ProposedSessions = ProposedSessions,
            Skipped = Skipped,
            MatchedEventCount = MatchedEventCount,
            ExistingSessionCount = ExistingSessions.Count,
            ResultSessionCount = ResultSessions.Count,
        };
    }
}
