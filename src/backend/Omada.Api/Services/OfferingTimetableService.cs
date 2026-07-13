using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class OfferingTimetableService : IOfferingTimetableService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IGroupScopeService _groupScope;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public OfferingTimetableService(
        ApplicationDbContext context,
        IUnitOfWork uow,
        IUserContext userContext,
        IGroupScopeService groupScope)
    {
        _context = context;
        _uow = uow;
        _userContext = userContext;
        _groupScope = groupScope;
    }

    public async Task<ServiceResponse<PublishTimetableResultDto>> PublishTimetableAsync(
        Guid periodId,
        Guid offeringId,
        PublishTimetableRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;

        var offering = await _context.CourseOfferings
            .Include(o => o.Period)
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                o.PeriodId == periodId &&
                !o.IsDeleted,
                cancellationToken);

        if (offering == null)
            return Fail(ErrorCodes.NotFound, "Offering not found.");

        var sessions = OfferingSessionPlanJson.Parse(offering.WeeklySessionPlanJson)
            .Where(s => s.EventTypeId.HasValue && s.Frequency != "as_needed")
            .ToList();

        if (sessions.Count == 0)
        {
            return Fail(ErrorCodes.InvalidInput,
                "Add at least one weekly session with an event type before publishing the timetable.");
        }

        var clientOffset = request.ClientUtcOffsetMinutes ?? 0;

        if (!request.ForceDespiteConflicts)
        {
            var offeringConflicts = await GetConflictsForOfferingInternalAsync(
                periodId, offering.Id, clientOffset, cancellationToken);
            if (offeringConflicts.Count > 0)
            {
                var preview = string.Join("; ", offeringConflicts.Take(3).Select(c => c.Message));
                return Fail(ErrorCodes.Conflict,
                    $"Cannot publish — {offeringConflicts.Count} scheduling conflict(s): {preview}. " +
                    "Adjust the pattern or publish with forceDespiteConflicts after reviewing the timetable preview.");
            }
        }

        var existingIds = ParseEventIds(offering.TimetablePublishedEventIdsJson);
        if (existingIds.Count > 0 && !request.ReplaceExisting)
        {
            return Fail(ErrorCodes.Conflict,
                "Timetable already published for this offering. Pass replaceExisting to republish.");
        }

        if (request.ReplaceExisting)
        {
            await SoftDeleteOfferingTimetableEventsAsync(
                offering.Id,
                offering.PeriodId,
                orgId,
                existingIds,
                cancellationToken);
        }

        var periodEndUtc = ScheduleWallClock.EndOfCalendarDayUtc(offering.Period.EndDate, clientOffset);
        var untilStr = periodEndUtc.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

        var createdIds = new List<Guid>();
        var typeNames = await LoadEventTypeNamesAsync(sessions, orgId, cancellationToken);
        var cohortNames = await LoadCohortNamesAsync(offering, orgId, cancellationToken);

        foreach (var session in sessions)
        {
            if (!session.EventTypeId.HasValue)
                continue;

            typeNames.TryGetValue(session.EventTypeId.Value, out var typeName);
            var activityLabel = typeName ?? session.EventTypeName ?? "Session";
            var defaultHostId = session.HostId ?? offering.HostId;

            var audienceScope = OfferingSessionPlanJson.NormalizeAudienceScope(session.AudienceScope);
            var cohortIds = audienceScope == "selected"
                ? session.CohortGroupIds?.Where(id => id != Guid.Empty).Distinct().ToList() ?? new List<Guid>()
                : new List<Guid>();

            var delivery = OfferingSessionPlanJson.NormalizeCohortDelivery(session.CohortDelivery);

            if (audienceScope == "selected" && cohortIds.Count == 0)
            {
                return Fail(ErrorCodes.InvalidInput,
                    $"Activity \"{activityLabel}\" uses selected groups but no series / subgroup was chosen.");
            }

            var durationHours = (double)Math.Max(0.25m, session.HoursPerSession);

            var instructorBlocks = MergeCompatibleInstructorBlocks(
                ResolveInstructorBlocks(session, defaultHostId, cohortIds).ToList());

            foreach (var block in instructorBlocks)
            {
                var blockHostId = block.HostId ?? defaultHostId;
                var blockHostDisplayName = blockHostId.HasValue ? null : block.HostDisplayName;
                var blockCohortIds = block.CohortIds;
                var freq = BuildRecurrenceRule(block.Frequency, untilStr);

                var start = ComputeFirstOccurrenceUtc(
                    offering.Period.StartDate,
                    block.DayOfWeek,
                    block.StartTimeLocal,
                    clientOffset,
                    block.BiweeklyPhase);

                if (start > periodEndUtc)
                    continue;

                var blockEnd = start.AddHours(durationHours);

                var blockDelivery = blockCohortIds.Count > 1 ? "combined" : delivery;
                var publishTargets = audienceScope == "selected"
                    ? ResolvePublishTargets(blockCohortIds, blockDelivery)
                    : ResolvePublishTargets([], delivery);

                foreach (var target in publishTargets)
                {
                    var title = $"{offering.Name} — {activityLabel}";
                    if (target.CohortGroupId.HasValue &&
                        cohortNames.TryGetValue(target.CohortGroupId.Value, out var cohortLabel))
                    {
                        title = $"{offering.Name} — {activityLabel} ({cohortLabel})";
                    }
                    else if (target.AudienceCohortGroupIdsJson != null && blockCohortIds.Count > 1)
                    {
                        title = $"{offering.Name} — {activityLabel} (combined groups)";
                    }

                    var evt = new Event
                    {
                        OrganizationId = orgId,
                        Title = title,
                        Description = offering.Code,
                        StartTime = start,
                        EndTime = blockEnd,
                        EventTypeId = session.EventTypeId.Value,
                        HostId = blockHostId,
                        HostDisplayName = blockHostDisplayName,
                        PeriodId = offering.PeriodId,
                        OfferingId = offering.Id,
                        CohortGroupId = target.CohortGroupId,
                        AudienceCohortGroupIdsJson = target.AudienceCohortGroupIdsJson,
                        RecurrenceRule = freq,
                        RoomId = block.RoomId
                    };

                    await _uow.Repository<Event>().AddAsync(evt);
                    createdIds.Add(evt.Id);
                }
            }
        }

        await _uow.CompleteAsync();

        offering.TimetablePublishedAt = DateTime.UtcNow;
        offering.TimetablePublishedEventIdsJson = JsonSerializer.Serialize(createdIds, JsonOptions);
        offering.TimetablePublishedPlanJson = OfferingSessionPlanJson.CanonicalSnapshot(offering.WeeklySessionPlanJson);
        _context.CourseOfferings.Update(offering);
        await _context.SaveChangesAsync(cancellationToken);

        var seeded = await SeedExpectedAttendanceInternalAsync(offering, cancellationToken);

        return new ServiceResponse<PublishTimetableResultDto>(true, new PublishTimetableResultDto
        {
            EventsCreated = createdIds.Count,
            ExpectedAttendanceRowsSeeded = seeded,
            PublishedAt = offering.TimetablePublishedAt.Value
        });
    }

    public async Task<ServiceResponse<PreviewTimetableResultDto>> PreviewTimetableAsync(
        Guid periodId,
        PreviewTimetableRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var clientOffset = request.ClientUtcOffsetMinutes ?? 0;

        var period = await _context.OrganizationPeriods.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == periodId && p.OrganizationId == orgId && !p.IsDeleted, cancellationToken);

        if (period == null)
            return FailPreview(ErrorCodes.NotFound, "Period not found.");

        var weekStartDate = request.WeekStartDate.Date;
        var weekEndDate = weekStartDate.AddDays(7);
        var rangeStartUtc = ScheduleWallClock.ToUtcInstant(weekStartDate, 0, 0, clientOffset);
        var rangeEndUtc = ScheduleWallClock.ToUtcInstant(weekEndDate, 0, 0, clientOffset);
        var periodEndUtc = ScheduleWallClock.EndOfCalendarDayUtc(period.EndDate, clientOffset);
        var untilStr = periodEndUtc.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

        var offeringsQuery = _context.CourseOfferings.AsNoTracking()
            .Include(o => o.Period)
            .Include(o => o.Host)
            .Include(o => o.ProgramGroup)
            .Include(o => o.Programs)
                .ThenInclude(p => p.ProgramGroup)
            .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId && !o.IsDeleted);

        if (request.OfferingId.HasValue)
            offeringsQuery = offeringsQuery.Where(o => o.Id == request.OfferingId.Value);

        if (request.ProgramGroupId.HasValue)
        {
            var programId = request.ProgramGroupId.Value;
            offeringsQuery = offeringsQuery.Where(o =>
                o.ProgramGroupId == programId ||
                o.Programs.Any(p => p.ProgramGroupId == programId && !p.IsDeleted));
        }

        var offerings = await offeringsQuery.ToListAsync(cancellationToken);
        var offeringIds = offerings.Select(o => o.Id).ToHashSet();
        var offeringProgramLabels = offerings.ToDictionary(o => o.Id, FormatOfferingProgramLabel);
        var eventTypeStyles = await LoadEventTypeStylesAsync(orgId, cancellationToken);

        var slots = new List<PreviewSlotInternal>();

        foreach (var offering in offerings)
        {
            if (offering.TimetablePublishedAt.HasValue)
                continue;

            slots.AddRange(CollectProposedSlots(
                offering,
                clientOffset,
                untilStr,
                periodEndUtc,
                rangeStartUtc,
                rangeEndUtc,
                request.HostId,
                eventTypeStyles,
                offeringProgramLabels.GetValueOrDefault(offering.Id)));
        }

        var publishedEvents = await _context.Events.AsNoTracking()
            .Include(e => e.EventType)
            .Include(e => e.Host)
            .Include(e => e.CohortGroup)
            .Include(e => e.Offering!)
                .ThenInclude(o => o.ProgramGroup)
            .Include(e => e.Offering!)
                .ThenInclude(o => o.Programs)
                .ThenInclude(p => p.ProgramGroup)
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted && e.PeriodId == periodId)
            .ToListAsync(cancellationToken);

        foreach (var evt in publishedEvents)
        {
            if (request.OfferingId.HasValue && evt.OfferingId != request.OfferingId)
                continue;

            if (request.ProgramGroupId.HasValue &&
                evt.OfferingId.HasValue &&
                !offeringIds.Contains(evt.OfferingId.Value))
                continue;

            if (request.HostId.HasValue && evt.HostId != request.HostId)
                continue;

            var duration = evt.EndTime - evt.StartTime;
            var programLabel = evt.OfferingId.HasValue
                ? offeringProgramLabels.GetValueOrDefault(evt.OfferingId.Value)
                  ?? (evt.Offering != null ? FormatOfferingProgramLabel(evt.Offering) : null)
                : null;

            foreach (var start in ExpandOccurrenceStarts(evt, rangeStartUtc, rangeEndUtc))
            {
                slots.Add(new PreviewSlotInternal
                {
                    Key = $"published:{evt.Id}:{start:O}",
                    Source = "published",
                    StartTime = start,
                    EndTime = start.Add(duration),
                    Title = evt.Title,
                    OfferingId = evt.OfferingId,
                    HostId = evt.HostId,
                    HostName = FormatUserName(evt.Host),
                    CohortGroupId = evt.CohortGroupId,
                    CohortGroupName = evt.CohortGroup?.Name,
                    AudienceCohortGroupIds = EventAudienceHelper.ParseAudienceCohortIds(evt.AudienceCohortGroupIdsJson),
                    EventTypeId = evt.EventTypeId,
                    EventTypeName = evt.EventType?.Name,
                    EventTypeColorHex = ResolveEventColorHex(evt.ColorHex, evt.EventType?.ColorHex),
                    ProgramGroupName = programLabel,
                    AudienceScope = evt.CohortGroupId.HasValue ||
                                    !string.IsNullOrWhiteSpace(evt.AudienceCohortGroupIdsJson)
                        ? "selected"
                        : "all",
                    RoomId = evt.RoomId
                });
            }
        }

        var offeringNames = offerings.ToDictionary(o => o.Id, o => o.Name);
        foreach (var slot in slots)
        {
            if (slot.OfferingId.HasValue && offeringNames.TryGetValue(slot.OfferingId.Value, out var name))
                slot.OfferingName = name;

            if (string.IsNullOrWhiteSpace(slot.ProgramGroupName) &&
                slot.OfferingId.HasValue &&
                offeringProgramLabels.TryGetValue(slot.OfferingId.Value, out var programLabel))
            {
                slot.ProgramGroupName = programLabel;
            }
        }

        await EnrichCohortNamesAsync(slots, orgId, cancellationToken);
        await EnrichHostNamesAsync(slots, orgId, cancellationToken);
        await PopulateEnrollmentAudiencesAsync(slots, offeringIds, orgId, cancellationToken);
        await PopulateCohortGroupNamesAsync(slots, orgId, cancellationToken);
        await EnrichRoomNamesAsync(slots, orgId, cancellationToken);

        if (request.GroupId.HasValue)
        {
            var scopeIds = await _groupScope.GetDescendantIdsAsync(orgId, request.GroupId.Value, includeSelf: true);
            slots = slots.Where(s => SlotMatchesGroupScope(s, scopeIds)).ToList();
        }

        var cohortNameMap = await LoadCohortNameMapForSlotsAsync(slots, orgId, cancellationToken);
        var conflicts = DetectPreviewConflicts(slots, cohortNameMap);
        conflicts = DedupeConflictMessages(conflicts);
        var conflictKeys = conflicts
            .SelectMany(c => new[] { c.SlotKeyA, c.SlotKeyB })
            .ToHashSet(StringComparer.Ordinal);

        foreach (var slot in slots)
            slot.HasConflict = conflictKeys.Contains(slot.Key);

        var result = new PreviewTimetableResultDto
        {
            WeekStartDate = weekStartDate,
            WeekEndDate = weekEndDate,
            Slots = slots
                .OrderBy(s => s.StartTime)
                .ThenBy(s => s.Title, StringComparer.OrdinalIgnoreCase)
                .Select(MapPreviewSlot)
                .ToList(),
            Conflicts = conflicts,
            ConflictCount = conflicts.Count
        };

        return new ServiceResponse<PreviewTimetableResultDto>(true, result);
    }

    public async Task<ServiceResponse<int>> SeedExpectedAttendanceAsync(
        Guid offeringId,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var offering = await _context.CourseOfferings.AsNoTracking()
            .Include(o => o.Period)
            .FirstOrDefaultAsync(o => o.Id == offeringId && o.OrganizationId == orgId && !o.IsDeleted, cancellationToken);

        if (offering == null)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.NotFound, "Offering not found."));

        var count = await SeedExpectedAttendanceInternalAsync(offering, cancellationToken);
        return new ServiceResponse<int>(true, count);
    }

    private async Task<int> SeedExpectedAttendanceInternalAsync(
        CourseOffering offering,
        CancellationToken cancellationToken)
    {
        // Roll is teacher-driven: do not pre-mark enrolled students as present/expected.
        await Task.CompletedTask;
        return 0;
    }

    private static IEnumerable<DateTime> ExpandOccurrenceStarts(Event evt, DateTime rangeStart, DateTime rangeEnd)
    {
        if (string.IsNullOrEmpty(evt.RecurrenceRule))
        {
            if (evt.StartTime >= rangeStart && evt.StartTime < rangeEnd)
                yield return evt.StartTime;
            yield break;
        }

        var rule = evt.RecurrenceRule;
        var interval = 1;
        var intervalMatch = Regex.Match(rule, "INTERVAL=(\\d+)");
        if (intervalMatch.Success)
            interval = int.Parse(intervalMatch.Groups[1].Value);

        DateTime? untilDate = null;
        var untilMatch = Regex.Match(rule, "UNTIL=(\\d{8}T\\d{6}Z)");
        if (untilMatch.Success &&
            DateTime.TryParseExact(untilMatch.Groups[1].Value, "yyyyMMddTHHmmssZ",
                null, DateTimeStyles.AdjustToUniversal, out var parsedUntil))
        {
            untilDate = parsedUntil;
        }

        var isWeekly = rule.Contains("FREQ=WEEKLY");
        var isMonthly = rule.Contains("FREQ=MONTHLY");
        var current = evt.StartTime;

        while (current < rangeEnd)
        {
            if (untilDate.HasValue && current > untilDate.Value)
                break;

            if (current >= rangeStart)
                yield return current;

            if (isWeekly)
                current = current.AddDays(7 * interval);
            else if (isMonthly)
                current = current.AddMonths(interval);
            else
                yield break;
        }
    }

    private static string BuildRecurrenceRule(string frequency, string untilStr) =>
        frequency switch
        {
            "biweekly" => $"FREQ=WEEKLY;INTERVAL=2;UNTIL={untilStr}",
            "monthly" => $"FREQ=MONTHLY;INTERVAL=1;UNTIL={untilStr}",
            _ => $"FREQ=WEEKLY;INTERVAL=1;UNTIL={untilStr}"
        };

    private static DateTime ComputeFirstOccurrenceUtc(
        DateTime periodStart,
        int dayOfWeek,
        string startTimeLocal,
        int clientUtcOffsetMinutes,
        int? biweeklyPhase = null)
    {
        var d = periodStart.Date;
        if (biweeklyPhase == 2)
            d = d.AddDays(7);

        while ((int)d.DayOfWeek != dayOfWeek)
            d = d.AddDays(1);

        var parts = startTimeLocal.Split(':');
        var hour = int.Parse(parts[0]);
        var minute = int.Parse(parts[1]);
        return ScheduleWallClock.ToUtcInstant(d, hour, minute, clientUtcOffsetMinutes);
    }

    private static DateTime TruncateToMinute(DateTime value) =>
        new(value.Year, value.Month, value.Day, value.Hour, value.Minute, 0, DateTimeKind.Utc);

    private sealed record PublishTarget(Guid? CohortGroupId, string? AudienceCohortGroupIdsJson);

    private sealed record InstructorBlock(
        Guid? HostId,
        string? HostDisplayName,
        List<Guid> CohortIds,
        int DayOfWeek,
        string StartTimeLocal,
        Guid? RoomId,
        string Frequency,
        int? BiweeklyPhase);

    private static IEnumerable<InstructorBlock> ResolveInstructorBlocks(
        OfferingWeeklySessionDto session,
        Guid? defaultHostId,
        List<Guid> allCohortIds)
    {
        var sessionDay = OfferingSessionPlanJson.NormalizeDayOfWeek(session.DayOfWeek);
        var sessionTime = OfferingSessionPlanJson.NormalizeStartTimeLocal(session.StartTimeLocal);
        var sessionFrequency = OfferingSessionPlanJson.NormalizeFrequency(session.Frequency);
        var sessionBiweeklyPhase = OfferingSessionPlanJson.NormalizeBiweeklyPhase(session.Frequency, session.BiweeklyPhase);

        if (session.CohortAssignments?.Count > 0)
        {
            foreach (var assignment in session.CohortAssignments)
            {
                var ids = assignment.CohortGroupIds?.Where(id => id != Guid.Empty).Distinct().ToList() ?? new List<Guid>();
                if (ids.Count == 0)
                    continue;

                var hostId = assignment.HostId ?? session.HostId ?? defaultHostId;
                var hostDisplayName = hostId.HasValue
                    ? null
                    : string.IsNullOrWhiteSpace(assignment.HostName) ? session.HostName?.Trim() : assignment.HostName.Trim();

                var blockFrequency = OfferingSessionPlanJson.NormalizeFrequency(assignment.Frequency ?? session.Frequency);
                var blockBiweeklyPhase = OfferingSessionPlanJson.NormalizeBiweeklyPhase(
                    assignment.Frequency ?? session.Frequency,
                    assignment.BiweeklyPhase ?? session.BiweeklyPhase);

                yield return new InstructorBlock(
                    hostId,
                    hostDisplayName,
                    ids,
                    OfferingSessionPlanJson.NormalizeDayOfWeek(assignment.DayOfWeek ?? sessionDay),
                    OfferingSessionPlanJson.NormalizeStartTimeLocal(assignment.StartTimeLocal ?? sessionTime),
                    assignment.RoomId ?? session.RoomId,
                    blockFrequency,
                    blockBiweeklyPhase);
            }

            yield break;
        }

        var sessionHostId = session.HostId ?? defaultHostId;
        var sessionHostDisplay = sessionHostId.HasValue ? null : session.HostName?.Trim();

        yield return new InstructorBlock(
            sessionHostId,
            sessionHostDisplay,
            allCohortIds,
            sessionDay,
            sessionTime,
            session.RoomId,
            sessionFrequency,
            sessionBiweeklyPhase);
    }

    private static List<InstructorBlock> MergeCompatibleInstructorBlocks(IReadOnlyList<InstructorBlock> blocks)
    {
        return blocks
            .GroupBy(b =>
                $"{b.DayOfWeek}|{b.StartTimeLocal}|{b.Frequency}|{b.BiweeklyPhase}|{b.HostId}|{b.RoomId}|{b.HostDisplayName ?? ""}",
                StringComparer.Ordinal)
            .Select(g =>
            {
                var first = g.First();
                var cohortIds = g.SelectMany(b => b.CohortIds).Where(id => id != Guid.Empty).Distinct().ToList();
                return first with { CohortIds = cohortIds };
            })
            .ToList();
    }

    private async Task SoftDeleteOfferingTimetableEventsAsync(
        Guid offeringId,
        Guid periodId,
        Guid orgId,
        IReadOnlyList<Guid> trackedIds,
        CancellationToken cancellationToken)
    {
        var trackedSet = trackedIds.Where(id => id != Guid.Empty).ToHashSet();

        // Remove every timetable event for this offering in the term (catches orphans from prior republishes),
        // plus any stale ids still listed on the offering.
        var toRemove = await _context.Events
            .Where(e =>
                e.OrganizationId == orgId &&
                !e.IsDeleted &&
                e.PeriodId == periodId &&
                (e.OfferingId == offeringId || trackedSet.Contains(e.Id)))
            .ToListAsync(cancellationToken);

        foreach (var ev in toRemove)
            ev.IsDeleted = true;
    }

    private static List<PublishTarget> ResolvePublishTargets(IReadOnlyList<Guid> cohortIds, string delivery)
    {
        if (cohortIds.Count == 0)
            return [new PublishTarget(null, null)];

        if (cohortIds.Count == 1)
            return [new PublishTarget(cohortIds[0], null)];

        if (delivery == "combined")
            return [new PublishTarget(null, EventAudienceHelper.SerializeAudienceCohortIds(cohortIds))];

        return cohortIds.Select(id => new PublishTarget(id, null)).ToList();
    }

    private async Task<Dictionary<Guid, string>> LoadCohortNamesAsync(
        CourseOffering offering,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = await _context.OfferingEnrollments.AsNoTracking()
            .Where(e => e.OfferingId == offering.Id && !e.IsDeleted && e.CohortGroupId.HasValue)
            .Select(e => e.CohortGroupId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (ids.Count == 0)
            return new Dictionary<Guid, string>();

        return await _context.Groups.AsNoTracking()
            .Where(g => ids.Contains(g.Id) && g.OrganizationId == orgId && !g.IsDeleted)
            .ToDictionaryAsync(g => g.Id, g => g.Name, cancellationToken);
    }

    private sealed record EventTypeStyle(string Name, string? ColorHex);

    private async Task<Dictionary<Guid, EventTypeStyle>> LoadEventTypeStylesAsync(
        Guid orgId,
        CancellationToken cancellationToken)
    {
        return await _context.EventTypes.AsNoTracking()
            .Where(t => t.OrganizationId == orgId && !t.IsDeleted)
            .ToDictionaryAsync(
                t => t.Id,
                t => new EventTypeStyle(t.Name, t.ColorHex),
                cancellationToken);
    }

    private static string? ResolveEventColorHex(string? eventColorHex, string? typeColorHex)
    {
        if (!string.IsNullOrWhiteSpace(eventColorHex))
            return eventColorHex.Trim();
        if (!string.IsNullOrWhiteSpace(typeColorHex))
            return typeColorHex.Trim();
        return null;
    }

    private static string? FormatOfferingProgramLabel(CourseOffering offering)
    {
        var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(offering.ProgramGroup?.Name))
            names.Add(offering.ProgramGroup.Name.Trim());

        foreach (var link in offering.Programs.Where(p => !p.IsDeleted))
        {
            var name = link.ProgramGroup?.Name?.Trim();
            if (!string.IsNullOrWhiteSpace(name))
                names.Add(name);
        }

        if (names.Count == 0)
            return null;

        return string.Join(", ", names.OrderBy(x => x, StringComparer.OrdinalIgnoreCase));
    }

    private async Task<Dictionary<Guid, string>> LoadEventTypeNamesAsync(
        IReadOnlyList<OfferingWeeklySessionDto> sessions,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = sessions.Where(s => s.EventTypeId.HasValue).Select(s => s.EventTypeId!.Value).Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, string>();

        return await _context.EventTypes.AsNoTracking()
            .Where(t => ids.Contains(t.Id) && t.OrganizationId == orgId && !t.IsDeleted)
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);
    }

    private static List<Guid> ParseEventIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<Guid>();

        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(json, JsonOptions) ?? new List<Guid>();
        }
        catch (JsonException)
        {
            return new List<Guid>();
        }
    }

    private static ServiceResponse<PublishTimetableResultDto> Fail(string code, string message) =>
        new(false, null!, new AppError(code, message));

    private static ServiceResponse<PreviewTimetableResultDto> FailPreview(string code, string message) =>
        new(false, null!, new AppError(code, message));

    private sealed class PreviewSlotInternal
    {
        public required string Key { get; init; }
        public required string Source { get; init; }
        public required DateTime StartTime { get; init; }
        public required DateTime EndTime { get; init; }
        public required string Title { get; init; }
        public Guid? OfferingId { get; init; }
        public string? OfferingName { get; set; }
        public Guid? HostId { get; init; }
        public string? HostName { get; set; }
        public Guid? CohortGroupId { get; init; }
        public string? CohortGroupName { get; set; }
        public HashSet<Guid> AudienceCohortGroupIds { get; init; } = new();
        public List<string> CohortGroupNames { get; set; } = new();
        public string? ActivityLabel { get; init; }
        public Guid? EventTypeId { get; init; }
        public string? EventTypeName { get; init; }
        public string? EventTypeColorHex { get; init; }
        public string? ProgramGroupName { get; set; }
        public string AudienceScope { get; set; } = "all";
        public HashSet<Guid> EnrolledCohortGroupIds { get; set; } = new();
        public Guid? RoomId { get; init; }
        public string? RoomName { get; set; }
        public bool HasConflict { get; set; }
    }

    private static TimetablePreviewSlotDto MapPreviewSlot(PreviewSlotInternal s) => new()
    {
        Key = s.Key,
        Source = s.Source,
        StartTime = s.StartTime,
        EndTime = s.EndTime,
        Title = s.Title,
        OfferingId = s.OfferingId,
        OfferingName = s.OfferingName,
        HostId = s.HostId,
        HostName = s.HostName,
        CohortGroupId = s.CohortGroupId,
        CohortGroupName = s.CohortGroupName,
        CohortGroupNames = s.CohortGroupNames.Count > 0 ? s.CohortGroupNames : null,
        ActivityLabel = s.ActivityLabel,
        EventTypeId = s.EventTypeId,
        EventTypeName = s.EventTypeName,
        EventTypeColorHex = s.EventTypeColorHex,
        ProgramGroupName = s.ProgramGroupName,
        AudienceScope = s.AudienceScope,
        RoomId = s.RoomId,
        RoomName = s.RoomName,
        HasConflict = s.HasConflict
    };

    private static string? FormatUserName(User? user) =>
        user == null ? null : $"{user.FirstName} {user.LastName}".Trim();

    private List<PreviewSlotInternal> CollectProposedSlots(
        CourseOffering offering,
        int clientOffset,
        string untilStr,
        DateTime periodEndUtc,
        DateTime rangeStartUtc,
        DateTime rangeEndUtc,
        Guid? hostFilter,
        IReadOnlyDictionary<Guid, EventTypeStyle> eventTypeStyles,
        string? programGroupName)
    {
        var slots = new List<PreviewSlotInternal>();
        var sessions = OfferingSessionPlanJson.Parse(offering.WeeklySessionPlanJson)
            .Where(s => s.EventTypeId.HasValue && s.Frequency != "as_needed")
            .ToList();

        if (sessions.Count == 0)
            return slots;

        var typeNames = sessions
            .Where(s => s.EventTypeId.HasValue)
            .ToDictionary(s => s.EventTypeId!.Value, s => s.EventTypeName ?? "Session");

        var cohortNames = new Dictionary<Guid, string>();

        for (var sessionIndex = 0; sessionIndex < sessions.Count; sessionIndex++)
        {
            var session = sessions[sessionIndex];
            if (!session.EventTypeId.HasValue)
                continue;

            typeNames.TryGetValue(session.EventTypeId.Value, out var typeName);
            var activityLabel = typeName ?? session.EventTypeName ?? "Session";
            eventTypeStyles.TryGetValue(session.EventTypeId.Value, out var typeStyle);
            var defaultHostId = session.HostId ?? offering.HostId;

            var audienceScope = OfferingSessionPlanJson.NormalizeAudienceScope(session.AudienceScope);
            var cohortIds = audienceScope == "selected"
                ? session.CohortGroupIds?.Where(id => id != Guid.Empty).Distinct().ToList() ?? new List<Guid>()
                : new List<Guid>();

            var delivery = OfferingSessionPlanJson.NormalizeCohortDelivery(session.CohortDelivery);
            var durationHours = (double)Math.Max(0.25m, session.HoursPerSession);

            var instructorBlocks = MergeCompatibleInstructorBlocks(
                ResolveInstructorBlocks(session, defaultHostId, cohortIds).ToList());

            for (var blockIndex = 0; blockIndex < instructorBlocks.Count; blockIndex++)
            {
                var block = instructorBlocks[blockIndex];
                var blockHostId = block.HostId ?? defaultHostId;

                if (hostFilter.HasValue && blockHostId != hostFilter)
                    continue;

                var freq = BuildRecurrenceRule(block.Frequency, untilStr);

                var start = ComputeFirstOccurrenceUtc(
                    offering.Period.StartDate,
                    block.DayOfWeek,
                    block.StartTimeLocal,
                    clientOffset,
                    block.BiweeklyPhase);

                if (start > periodEndUtc)
                    continue;

                var blockDelivery = block.CohortIds.Count > 1 ? "combined" : delivery;
                var publishTargets = audienceScope == "selected"
                    ? ResolvePublishTargets(block.CohortIds, blockDelivery)
                    : ResolvePublishTargets([], delivery);

                for (var targetIndex = 0; targetIndex < publishTargets.Count; targetIndex++)
                {
                    var target = publishTargets[targetIndex];
                    var title = $"{offering.Name} — {activityLabel}";
                    string? cohortName = null;

                    if (target.CohortGroupId.HasValue)
                    {
                        cohortNames.TryGetValue(target.CohortGroupId.Value, out cohortName);
                        if (cohortName != null)
                            title = $"{offering.Name} — {activityLabel} ({cohortName})";
                    }
                    else if (target.AudienceCohortGroupIdsJson != null && block.CohortIds.Count > 1)
                    {
                        title = $"{offering.Name} — {activityLabel} (combined groups)";
                    }

                    var draftEvent = new Event
                    {
                        StartTime = start,
                        EndTime = start.AddHours(durationHours),
                        RecurrenceRule = freq
                    };

                    foreach (var occurrenceStart in ExpandOccurrenceStarts(draftEvent, rangeStartUtc, rangeEndUtc))
                    {
                        var occurrenceEnd = occurrenceStart.AddHours(durationHours);
                        slots.Add(new PreviewSlotInternal
                        {
                            Key = $"proposed:{offering.Id}:{sessionIndex}:{blockIndex}:{targetIndex}:{occurrenceStart:O}",
                            Source = "proposed",
                            StartTime = occurrenceStart,
                            EndTime = occurrenceEnd,
                            Title = title,
                            OfferingId = offering.Id,
                            OfferingName = offering.Name,
                            HostId = blockHostId,
                            HostName = FormatUserName(offering.Host),
                            CohortGroupId = target.CohortGroupId,
                            CohortGroupName = cohortName,
                            AudienceCohortGroupIds = EventAudienceHelper.ParseAudienceCohortIds(target.AudienceCohortGroupIdsJson),
                            ActivityLabel = activityLabel,
                            EventTypeId = session.EventTypeId,
                            EventTypeName = activityLabel,
                            EventTypeColorHex = typeStyle?.ColorHex,
                            ProgramGroupName = programGroupName,
                            AudienceScope = audienceScope,
                            RoomId = block.RoomId
                        });
                    }
                }
            }
        }

        return slots;
    }

    private async Task EnrichCohortNamesAsync(
        List<PreviewSlotInternal> slots,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = slots
            .Where(s => s.CohortGroupId.HasValue && string.IsNullOrEmpty(s.CohortGroupName))
            .Select(s => s.CohortGroupId!.Value)
            .Concat(slots.SelectMany(s => s.AudienceCohortGroupIds))
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return;

        var names = await _context.Groups.AsNoTracking()
            .Where(g => ids.Contains(g.Id) && g.OrganizationId == orgId && !g.IsDeleted)
            .ToDictionaryAsync(g => g.Id, g => g.Name, cancellationToken);

        foreach (var slot in slots)
        {
            if (slot.CohortGroupId.HasValue &&
                string.IsNullOrEmpty(slot.CohortGroupName) &&
                names.TryGetValue(slot.CohortGroupId.Value, out var name))
            {
                slot.CohortGroupName = name;
            }
        }
    }

    private async Task EnrichHostNamesAsync(
        List<PreviewSlotInternal> slots,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = slots
            .Where(s => s.HostId.HasValue && string.IsNullOrEmpty(s.HostName))
            .Select(s => s.HostId!.Value)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return;

        var users = await _context.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => FormatUserName(u) ?? "Staff", cancellationToken);

        foreach (var slot in slots)
        {
            if (slot.HostId.HasValue &&
                string.IsNullOrEmpty(slot.HostName) &&
                users.TryGetValue(slot.HostId.Value, out var name))
            {
                slot.HostName = name;
            }
        }
    }

    private static List<TimetablePreviewConflictDto> DetectPreviewConflicts(
        List<PreviewSlotInternal> slots,
        IReadOnlyDictionary<Guid, string> cohortNames)
    {
        var conflicts = new List<TimetablePreviewConflictDto>();

        for (var i = 0; i < slots.Count; i++)
        {
            for (var j = i + 1; j < slots.Count; j++)
            {
                var a = slots[i];
                var b = slots[j];

                if (!TimeRangesOverlap(a.StartTime, a.EndTime, b.StartTime, b.EndTime))
                    continue;

                var complementarySplit = IsComplementarySplitAudience(a, b);

                if (!complementarySplit && HostConflict(a, b))
                {
                    conflicts.Add(new TimetablePreviewConflictDto
                    {
                        ConflictType = "host",
                        SlotKeyA = a.Key,
                        SlotKeyB = b.Key,
                        Message = $"Instructor double-booked ({a.HostName ?? "staff"}): {a.Title} overlaps {b.Title}"
                    });
                }

                if (!complementarySplit && CohortConflict(a, b, cohortNames, out var cohortMessage))
                {
                    conflicts.Add(new TimetablePreviewConflictDto
                    {
                        ConflictType = "cohort",
                        SlotKeyA = a.Key,
                        SlotKeyB = b.Key,
                        Message = cohortMessage
                    });
                }

                // Complementary split groups (same activity, same slot, disjoint cohorts) share one room booking.
                if (!complementarySplit && RoomConflict(a, b, out var roomMessage))
                {
                    conflicts.Add(new TimetablePreviewConflictDto
                    {
                        ConflictType = "room",
                        SlotKeyA = a.Key,
                        SlotKeyB = b.Key,
                        Message = roomMessage
                    });
                }
            }
        }

        return conflicts;
    }

    private async Task<Dictionary<Guid, string>> LoadCohortNameMapForSlotsAsync(
        List<PreviewSlotInternal> slots,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = slots
            .SelectMany(EffectiveAudienceCohortSet)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return new Dictionary<Guid, string>();

        return await _context.Groups.AsNoTracking()
            .Where(g => ids.Contains(g.Id) && g.OrganizationId == orgId && !g.IsDeleted)
            .ToDictionaryAsync(g => g.Id, g => g.Name, cancellationToken);
    }

    private async Task PopulateEnrollmentAudiencesAsync(
        List<PreviewSlotInternal> slots,
        HashSet<Guid> offeringIds,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        if (offeringIds.Count == 0)
            return;

        var enrollments = await _context.OfferingEnrollments.AsNoTracking()
            .Where(e => offeringIds.Contains(e.OfferingId) && e.OrganizationId == orgId && !e.IsDeleted && e.CohortGroupId.HasValue)
            .Select(e => new { e.OfferingId, CohortGroupId = e.CohortGroupId!.Value })
            .ToListAsync(cancellationToken);

        var byOffering = enrollments
            .GroupBy(e => e.OfferingId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.CohortGroupId).ToHashSet());

        foreach (var slot in slots)
        {
            if (!slot.OfferingId.HasValue ||
                !byOffering.TryGetValue(slot.OfferingId.Value, out var enrolled))
                continue;

            slot.EnrolledCohortGroupIds = enrolled;
        }
    }

    private async Task PopulateCohortGroupNamesAsync(
        List<PreviewSlotInternal> slots,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = slots
            .SelectMany(s => s.AudienceCohortGroupIds)
            .Concat(slots.Where(s => s.CohortGroupId.HasValue).Select(s => s.CohortGroupId!.Value))
            .Concat(slots.SelectMany(s => s.EnrolledCohortGroupIds))
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return;

        var names = await _context.Groups.AsNoTracking()
            .Where(g => ids.Contains(g.Id) && g.OrganizationId == orgId && !g.IsDeleted)
            .ToDictionaryAsync(g => g.Id, g => g.Name, cancellationToken);

        foreach (var slot in slots)
        {
            if (slot.CohortGroupNames.Count > 0)
                continue;

            if (slot.CohortGroupId.HasValue && names.TryGetValue(slot.CohortGroupId.Value, out var single))
            {
                slot.CohortGroupNames.Add(single);
                continue;
            }

            foreach (var id in slot.AudienceCohortGroupIds.OrderBy(x => x))
            {
                if (names.TryGetValue(id, out var label))
                    slot.CohortGroupNames.Add(label);
            }

            if (slot.CohortGroupNames.Count == 0 &&
                string.Equals(slot.AudienceScope, "all", StringComparison.OrdinalIgnoreCase))
            {
                foreach (var id in slot.EnrolledCohortGroupIds.OrderBy(x => x))
                {
                    if (names.TryGetValue(id, out var label))
                        slot.CohortGroupNames.Add(label);
                }
            }
        }
    }

    private static List<TimetablePreviewConflictDto> DedupeConflictMessages(
        List<TimetablePreviewConflictDto> conflicts) =>
        conflicts
            .GroupBy(c => $"{c.ConflictType}|{c.Message}", StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();

    private static bool TimeRangesOverlap(DateTime s1, DateTime e1, DateTime s2, DateTime e2) =>
        s1 < e2 && e1 > s2;

    private static bool HostConflict(PreviewSlotInternal a, PreviewSlotInternal b) =>
        a.HostId.HasValue && b.HostId.HasValue && a.HostId == b.HostId;

    private static bool RoomConflict(PreviewSlotInternal a, PreviewSlotInternal b, out string message)
    {
        message = string.Empty;
        if (!a.RoomId.HasValue || !b.RoomId.HasValue || a.RoomId != b.RoomId)
            return false;

        var roomLabel = a.RoomName ?? b.RoomName ?? "room";
        message = $"Room double-booked ({roomLabel}): {a.Title} overlaps {b.Title}";
        return true;
    }

    private static bool CohortConflict(
        PreviewSlotInternal a,
        PreviewSlotInternal b,
        IReadOnlyDictionary<Guid, string> cohortNames,
        out string message)
    {
        message = string.Empty;
        var setA = EffectiveAudienceCohortSet(a);
        var setB = EffectiveAudienceCohortSet(b);

        HashSet<Guid> shared;
        if (setA.Count > 0 && setB.Count > 0)
        {
            shared = setA.Intersect(setB).ToHashSet();
            if (shared.Count == 0)
                return false;
        }
        else if (setA.Count == 0 && setB.Count == 0)
        {
            if (!a.OfferingId.HasValue || a.OfferingId != b.OfferingId)
                return false;

            var aAll = string.Equals(a.AudienceScope, "all", StringComparison.OrdinalIgnoreCase);
            var bAll = string.Equals(b.AudienceScope, "all", StringComparison.OrdinalIgnoreCase);
            if (!aAll || !bAll || a.EnrolledCohortGroupIds.Count == 0)
                return false;

            message = $"Whole-offering overlap: {a.Title} overlaps {b.Title}";
            return true;
        }
        else
        {
            return false;
        }

        var labels = shared
            .Select(id => cohortNames.TryGetValue(id, out var name) ? name : "group")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();
        var groupHint = labels.Count > 0 ? $" ({string.Join(", ", labels)})" : string.Empty;
        message = $"Student group schedule overlap{groupHint}: {a.Title} overlaps {b.Title}";
        return true;
    }

    private static bool SlotMatchesGroupScope(PreviewSlotInternal slot, HashSet<Guid> scopeIds)
    {
        if (slot.CohortGroupId.HasValue && scopeIds.Contains(slot.CohortGroupId.Value))
            return true;

        if (slot.AudienceCohortGroupIds.Any(scopeIds.Contains))
            return true;

        return EffectiveAudienceCohortSet(slot).Any(scopeIds.Contains);
    }

    private static bool IsComplementarySplitAudience(PreviewSlotInternal a, PreviewSlotInternal b)
    {
        if (!a.OfferingId.HasValue || a.OfferingId != b.OfferingId)
            return false;

        if (a.StartTime != b.StartTime || a.EndTime != b.EndTime)
            return false;

        if (!string.Equals(a.ActivityLabel, b.ActivityLabel, StringComparison.OrdinalIgnoreCase))
            return false;

        var setA = EffectiveAudienceCohortSet(a);
        var setB = EffectiveAudienceCohortSet(b);
        if (setA.Count == 0 || setB.Count == 0)
            return false;

        return !setA.Overlaps(setB);
    }

    private static HashSet<Guid> EffectiveAudienceCohortSet(PreviewSlotInternal slot)
    {
        if (slot.CohortGroupId.HasValue)
            return new HashSet<Guid> { slot.CohortGroupId.Value };

        if (slot.AudienceCohortGroupIds.Count > 0)
            return slot.AudienceCohortGroupIds;

        if (string.Equals(slot.AudienceScope, "all", StringComparison.OrdinalIgnoreCase))
            return slot.EnrolledCohortGroupIds;

        return new HashSet<Guid>();
    }

    private static HashSet<Guid> AudienceCohortSet(PreviewSlotInternal slot) =>
        EffectiveAudienceCohortSet(slot);

    private async Task EnrichRoomNamesAsync(
        List<PreviewSlotInternal> slots,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = slots
            .Where(s => s.RoomId.HasValue && string.IsNullOrEmpty(s.RoomName))
            .Select(s => s.RoomId!.Value)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return;

        var names = await _context.Rooms.AsNoTracking()
            .Where(r => ids.Contains(r.Id) && r.OrganizationId == orgId && !r.IsDeleted)
            .ToDictionaryAsync(r => r.Id, r => r.Name, cancellationToken);

        foreach (var slot in slots)
        {
            if (slot.RoomId.HasValue &&
                string.IsNullOrEmpty(slot.RoomName) &&
                names.TryGetValue(slot.RoomId.Value, out var label))
            {
                slot.RoomName = label;
            }
        }
    }

    private static DateTime GetRepresentativeWeekStart(DateTime periodStart, DateTime periodEnd)
    {
        var start = periodStart.Date;
        var end = periodEnd.Date;
        var today = DateTime.UtcNow.Date;

        DateTime anchor;
        if (today >= start && today <= end)
            anchor = today;
        else
            anchor = start;

        var dow = (int)anchor.DayOfWeek;
        var mondayOffset = dow == 0 ? -6 : 1 - dow;
        return anchor.AddDays(mondayOffset);
    }

    private async Task<List<TimetablePreviewConflictDto>> GetConflictsForOfferingInternalAsync(
        Guid periodId,
        Guid offeringId,
        int clientOffset,
        CancellationToken cancellationToken)
    {
        var period = await _context.OrganizationPeriods.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == periodId && !p.IsDeleted, cancellationToken);
        if (period == null)
            return [];

        var weekStart = GetRepresentativeWeekStart(period.StartDate, period.EndDate);
        var preview = await PreviewTimetableAsync(periodId, new PreviewTimetableRequest
        {
            WeekStartDate = weekStart,
            ClientUtcOffsetMinutes = clientOffset
        }, cancellationToken);

        if (!preview.IsSuccess || preview.Data == null)
            return [];

        var slotByKey = preview.Data.Slots.ToDictionary(s => s.Key, StringComparer.Ordinal);
        return preview.Data.Conflicts
            .Where(c =>
            {
                slotByKey.TryGetValue(c.SlotKeyA, out var a);
                slotByKey.TryGetValue(c.SlotKeyB, out var b);
                return a?.OfferingId == offeringId || b?.OfferingId == offeringId;
            })
            .ToList();
    }

    public async Task<ServiceResponse<TimetablePublishStatusResultDto>> GetPublishStatusAsync(
        Guid periodId,
        TimetablePublishStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var period = await _context.OrganizationPeriods.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == periodId && p.OrganizationId == orgId && !p.IsDeleted, cancellationToken);

        if (period == null)
            return FailPreviewStatus(ErrorCodes.NotFound, "Period not found.");

        var offeringsQuery = _context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId && !o.IsDeleted);

        if (request.OfferingId.HasValue)
            offeringsQuery = offeringsQuery.Where(o => o.Id == request.OfferingId.Value);

        if (request.ProgramGroupId.HasValue)
        {
            var programId = request.ProgramGroupId.Value;
            offeringsQuery = offeringsQuery.Where(o =>
                o.ProgramGroupId == programId ||
                o.Programs.Any(p => p.ProgramGroupId == programId && !p.IsDeleted));
        }

        var offerings = await offeringsQuery
            .OrderBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var weekStart = request.WeekStartDate?.Date ?? GetRepresentativeWeekStart(period.StartDate, period.EndDate);

        // Conflict detection always uses the full term schedule (same as publish guardrails),
        // so scoped view filters cannot hide cross-teacher / cross-program overlaps.
        var fullPreview = await PreviewTimetableAsync(periodId, new PreviewTimetableRequest
        {
            WeekStartDate = weekStart,
            ClientUtcOffsetMinutes = request.ClientUtcOffsetMinutes
        }, cancellationToken);

        if (!fullPreview.IsSuccess || fullPreview.Data == null)
            return FailPreviewStatus(fullPreview.Error?.Code ?? ErrorCodes.InvalidInput, fullPreview.Error?.Message ?? "Preview failed.");

        var slotByKey = fullPreview.Data.Slots.ToDictionary(s => s.Key, StringComparer.Ordinal);
        var conflictsByOffering = new Dictionary<Guid, List<TimetablePreviewConflictDto>>();

        foreach (var conflict in fullPreview.Data.Conflicts)
        {
            slotByKey.TryGetValue(conflict.SlotKeyA, out var a);
            slotByKey.TryGetValue(conflict.SlotKeyB, out var b);
            foreach (var offeringId in new[] { a?.OfferingId, b?.OfferingId })
            {
                if (!offeringId.HasValue)
                    continue;
                if (!conflictsByOffering.TryGetValue(offeringId.Value, out var list))
                {
                    list = new List<TimetablePreviewConflictDto>();
                    conflictsByOffering[offeringId.Value] = list;
                }
                if (list.All(x => x.Message != conflict.Message))
                    list.Add(conflict);
            }
        }

        var rows = offerings.Select(o =>
        {
            var sessions = OfferingSessionPlanJson.Parse(o.WeeklySessionPlanJson)
                .Where(s => s.EventTypeId.HasValue && s.Frequency != "as_needed")
                .ToList();
            var hasPattern = sessions.Count > 0;
            conflictsByOffering.TryGetValue(o.Id, out var conflicts);
            var conflictCount = conflicts?.Count ?? 0;
            var isPublished = o.TimetablePublishedAt.HasValue;
            var needsRepublish = isPublished && hasPattern && conflictCount == 0 &&
                OfferingSessionPlanJson.PatternChangedSincePublish(
                    o.WeeklySessionPlanJson,
                    o.TimetablePublishedPlanJson,
                    o.TimetablePublishedAt,
                    o.UpdatedAt);
            return new TimetableOfferingPublishStatusDto
            {
                OfferingId = o.Id,
                OfferingName = o.Name,
                Code = o.Code,
                HasPattern = hasPattern,
                IsPublished = isPublished,
                PublishedAt = o.TimetablePublishedAt,
                NeedsRepublish = needsRepublish,
                ConflictCount = conflictCount,
                ConflictMessages = conflicts?.Take(3).Select(c => c.Message).ToList()
            };
        }).ToList();

        var withPattern = rows.Count(r => r.HasPattern);
        var published = rows.Count(r => r.IsPublished);
        var withConflicts = rows.Count(r => r.ConflictCount > 0);
        var ready = rows.Count(r => r.HasPattern && r.ConflictCount == 0 && !r.IsPublished);
        var readyToRepublish = rows.Count(r => r.NeedsRepublish);

        var scopeFiltersApplied =
            request.ProgramGroupId.HasValue ||
            request.HostId.HasValue ||
            request.GroupId.HasValue ||
            request.OfferingId.HasValue;

        return new ServiceResponse<TimetablePublishStatusResultDto>(true, new TimetablePublishStatusResultDto
        {
            Offerings = rows,
            TotalCount = rows.Count,
            PublishedCount = published,
            WithPatternCount = withPattern,
            WithConflictsCount = withConflicts,
            ReadyToPublishCount = ready,
            ReadyToRepublishCount = readyToRepublish,
            ScopeFiltersApplied = scopeFiltersApplied
        });
    }

    public async Task<ServiceResponse<BulkPublishTimetableResultDto>> BulkPublishTimetableAsync(
        Guid periodId,
        BulkPublishTimetableRequest request,
        CancellationToken cancellationToken = default)
    {
        var statusResponse = await GetPublishStatusAsync(periodId, new TimetablePublishStatusRequest
        {
            ProgramGroupId = request.ProgramGroupId,
            ClientUtcOffsetMinutes = request.ClientUtcOffsetMinutes
        }, cancellationToken);

        if (!statusResponse.IsSuccess || statusResponse.Data == null)
            return FailBulk(statusResponse.Error?.Code ?? ErrorCodes.InvalidInput, statusResponse.Error?.Message ?? "Could not load publish status.");

        var targetIds = request.OfferingIds?.Where(id => id != Guid.Empty).Distinct().ToHashSet();
        var rows = statusResponse.Data.Offerings
            .Where(o => targetIds == null || targetIds.Contains(o.OfferingId))
            .ToList();

        var results = new List<BulkPublishOfferingResultDto>();
        var publishedCount = 0;
        var skippedConflict = 0;
        var failedCount = 0;

        foreach (var row in rows)
        {
            if (!row.HasPattern)
            {
                results.Add(new BulkPublishOfferingResultDto
                {
                    OfferingId = row.OfferingId,
                    OfferingName = row.OfferingName,
                    Outcome = "skipped_no_pattern",
                    Message = "No weekly pattern with activities."
                });
                continue;
            }

            if (row.ConflictCount > 0 && request.SkipWithConflicts && !request.ForceDespiteConflicts)
            {
                skippedConflict++;
                results.Add(new BulkPublishOfferingResultDto
                {
                    OfferingId = row.OfferingId,
                    OfferingName = row.OfferingName,
                    Outcome = "skipped_conflict",
                    Message = row.ConflictMessages?.FirstOrDefault() ??
                              $"{row.ConflictCount} conflict(s) with other courses, groups, instructors, or rooms this term."
                });
                continue;
            }

            var wasPublished = row.IsPublished;
            var replace = wasPublished || request.ReplaceExisting;
            var publish = await PublishTimetableAsync(periodId, row.OfferingId, new PublishTimetableRequest
            {
                ReplaceExisting = replace,
                ClientUtcOffsetMinutes = request.ClientUtcOffsetMinutes,
                ForceDespiteConflicts = request.ForceDespiteConflicts
            }, cancellationToken);

            if (!publish.IsSuccess || publish.Data == null)
            {
                failedCount++;
                results.Add(new BulkPublishOfferingResultDto
                {
                    OfferingId = row.OfferingId,
                    OfferingName = row.OfferingName,
                    Outcome = "failed",
                    Message = publish.Error?.Message ?? "Publish failed."
                });
                continue;
            }

            publishedCount++;
            results.Add(new BulkPublishOfferingResultDto
            {
                OfferingId = row.OfferingId,
                OfferingName = row.OfferingName,
                Outcome = wasPublished ? "republished" : "published",
                EventsCreated = publish.Data.EventsCreated
            });
        }

        return new ServiceResponse<BulkPublishTimetableResultDto>(true, new BulkPublishTimetableResultDto
        {
            PublishedCount = publishedCount,
            SkippedConflictCount = skippedConflict,
            FailedCount = failedCount,
            Results = results
        });
    }

    private static ServiceResponse<TimetablePublishStatusResultDto> FailPreviewStatus(string code, string message) =>
        new(false, null!, new AppError(code, message));

    private static ServiceResponse<BulkPublishTimetableResultDto> FailBulk(string code, string message) =>
        new(false, null!, new AppError(code, message));
}
