using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Organizations;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Infrastructure.Scraping;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ScrapedScheduleImportResolutionService : IScrapedScheduleImportResolutionService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContext _userContext;
    private readonly IScrapedEntityResolutionService _entityResolution;
    private readonly IScrapedHostAliasService _hostAliases;

    private static readonly Regex GroupHeading = new(@"\bgrupa\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public ScrapedScheduleImportResolutionService(
        ApplicationDbContext context,
        IUserContext userContext,
        IScrapedEntityResolutionService entityResolution,
        IScrapedHostAliasService hostAliases)
    {
        _context = context;
        _userContext = userContext;
        _entityResolution = entityResolution;
        _hostAliases = hostAliases;
    }

    public async Task<ServiceResponse<ScrapedImportResolutionResultDto>> ResolveAsync(
        ScrapedImportResolutionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Events.Count == 0)
        {
            return new ServiceResponse<ScrapedImportResolutionResultDto>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, "No scraped sessions to resolve."));
        }

        var orgId = _userContext.OrganizationId;
        var org = await _context.Organizations.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orgId, cancellationToken);

        var implicitCourse = await ResolveImplicitCourseNameAsync(request, cancellationToken);
        var enriched = ScrapedScheduleRowEnricher.EnrichRows(
            ScrapedScheduleNormalizer.EnrichAll(request.Events),
            implicitCourse);

        var emptyOrActivitySubjectCount = enriched.Count(e =>
        {
            var subject = ScrapedScheduleRowEnricher.NormalizeSubjectLabel(e.ClassName);
            return string.IsNullOrWhiteSpace(subject) || ScrapedScheduleRowEnricher.IsActivityOnlyLabel(subject);
        });

        var recommendSingle = emptyOrActivitySubjectCount >= enriched.Count / 2
                              || request.SelectedOfferingId.HasValue
                              || !string.IsNullOrWhiteSpace(implicitCourse);

        var offerings = await _context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && o.PeriodId == request.PeriodId && !o.IsDeleted)
            .Select(o => new OfferingRow(o.Id, o.Name, o.Code))
            .ToListAsync(cancellationToken);

        var eventTypes = await _context.EventTypes.AsNoTracking()
            .Where(t => t.OrganizationId == orgId && !t.IsDeleted)
            .Select(t => new NamedRow(t.Id, t.Name))
            .ToListAsync(cancellationToken);

        var groups = await _context.Groups.AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted)
            .Select(g => new GroupRow(g.Id, g.Name, g.Type))
            .ToListAsync(cancellationToken);

        var rooms = await _context.Rooms.AsNoTracking()
            .Where(r => r.OrganizationId == orgId && !r.IsDeleted)
            .Select(r => new NamedRow(r.Id, r.Name))
            .ToListAsync(cancellationToken);

        var users = await (
            from m in _context.OrganizationMembers.AsNoTracking()
            join u in _context.Users.AsNoTracking() on m.UserId equals u.Id
            where m.OrganizationId == orgId && m.IsActive
            select new UserRow(u.Id, u.FirstName, u.LastName, u.Email)
        ).ToListAsync(cancellationToken);

        var resolutionMaps = await _entityResolution.BuildMapsAsync(orgId, enriched, cancellationToken);
        var hostAliases = ScrapedHostAliasJson.IndexByLabel(await _hostAliases.GetAliasesForOrgAsync(orgId, cancellationToken));

        var subjectLabels = CountLabels(enriched.Select(e => ScrapedScheduleRowEnricher.NormalizeSubjectLabel(e.ClassName)));
        var activityLabels = CountLabels(enriched.Select(e =>
            ScrapedScheduleRowEnricher.NormalizeActivityLabel(
                string.IsNullOrWhiteSpace(e.ActivityType) ? e.ClassName : e.ActivityType)));
        var professorLabels = CountLabels(
            enriched.SelectMany(e => ScrapedScheduleRowEnricher.SplitProfessorLabels(e.Professor)));
        var roomLabels = CountLabels(enriched.Select(e => (e.Room ?? string.Empty).Trim()));

        var studyGroupSource = enriched
            .Select(e => (e.GroupNumber ?? string.Empty).Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s));
        if (!string.IsNullOrWhiteSpace(request.StudyGroupLabel))
            studyGroupSource = studyGroupSource.Append(request.StudyGroupLabel.Trim());
        var studyGroupLabels = CountLabels(studyGroupSource.Where(s => !GroupHeading.IsMatch(s)));

        Guid? suggestedOfferingId = request.SelectedOfferingId;
        string? suggestedOfferingName = null;
        if (suggestedOfferingId.HasValue)
        {
            suggestedOfferingName = offerings.FirstOrDefault(o => o.Id == suggestedOfferingId)?.Name;
        }
        else if (recommendSingle && !string.IsNullOrWhiteSpace(implicitCourse))
        {
            var match = ScoreByName(offerings.Select(o => (o.Id, o.Name, o.Code)).ToList(), implicitCourse).FirstOrDefault();
            if (match.Score >= 0.55f)
            {
                suggestedOfferingId = match.Id;
                suggestedOfferingName = match.Label;
            }
        }

        return new ServiceResponse<ScrapedImportResolutionResultDto>(true, new ScrapedImportResolutionResultDto
        {
            ScopeSummary = BuildScopeSummary(enriched.Count, request.StudyGroupLabel, recommendSingle),
            RecommendSingleOfferingImport = recommendSingle,
            SuggestedOfferingId = suggestedOfferingId,
            SuggestedOfferingName = suggestedOfferingName,
            ImplicitCourseName = implicitCourse,
            Subjects = BuildOfferingFieldResolutions(subjectLabels, offerings),
            ActivityTypes = BuildNamedFieldResolutions(activityLabels, eventTypes, MatchActivityToEventType),
            EventTypes = BuildNamedFieldResolutions(activityLabels, eventTypes, MatchActivityToEventType),
            Professors = BuildProfessorResolutions(professorLabels, users, resolutionMaps, hostAliases),
            Rooms = BuildRoomFieldResolutions(roomLabels, rooms, resolutionMaps),
            StudyGroups = BuildGroupResolutions(studyGroupLabels, groups, org?.OrganizationType ?? OrganizationType.University),
        });
    }

    private async Task<string?> ResolveImplicitCourseNameAsync(
        ScrapedImportResolutionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.SelectedOfferingId.HasValue)
        {
            var offering = await _context.CourseOfferings.AsNoTracking()
                .FirstOrDefaultAsync(
                    o => o.Id == request.SelectedOfferingId
                         && o.OrganizationId == _userContext.OrganizationId
                         && o.PeriodId == request.PeriodId
                         && !o.IsDeleted,
                    cancellationToken);
            if (offering != null)
                return offering.Name;
        }

        var distinctSubjects = request.Events
            .Select(e => ScrapedScheduleRowEnricher.NormalizeSubjectLabel(e.ClassName))
            .Where(s => !string.IsNullOrWhiteSpace(s) && !ScrapedScheduleRowEnricher.IsActivityOnlyLabel(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (distinctSubjects.Count >= 2)
            return null;

        foreach (var row in request.Events)
        {
            var hint = ScrapedScheduleRowEnricher.ResolveCourseHint(row, null);
            if (string.IsNullOrWhiteSpace(hint)
                || ScrapedScheduleRowEnricher.IsActivityOnlyLabel(hint)
                || ScrapedScheduleRowEnricher.IsProgramOrGroupPageCode(hint))
                continue;

            return hint;
        }

        return null;
    }

    private static Dictionary<string, int> CountLabels(IEnumerable<string> labels)
    {
        return labels
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .GroupBy(s => s, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
    }

    private static string BuildScopeSummary(int count, string? groupLabel, bool singleCourse)
    {
        if (singleCourse)
            return $"{count} session row(s) — single-course page (subject may be in the page title, not each row).";
        if (!string.IsNullOrWhiteSpace(groupLabel))
            return $"{count} session row(s) for study group {groupLabel}.";
        return $"{count} session row(s) in this import scope.";
    }

    private static IReadOnlyList<ScrapedImportFieldResolutionDto> BuildOfferingFieldResolutions(
        Dictionary<string, int> labels,
        IReadOnlyList<OfferingRow> offerings)
    {
        return labels.Select(pair =>
        {
            var suggestions = ScoreByName(offerings.Select(o => (o.Id, o.Name, o.Code)).ToList(), pair.Key)
                .Take(5)
                .Select(s => new ScrapedImportSuggestionDto
                {
                    Id = s.Id,
                    Label = s.Label,
                    Subtitle = s.Subtitle,
                    Score = s.Score,
                })
                .ToList();

            var top = suggestions.FirstOrDefault();
            return new ScrapedImportFieldResolutionDto
            {
                ScrapedLabel = pair.Key,
                EventCount = pair.Value,
                SuggestedTargetId = top?.Id,
                SuggestedTargetLabel = top?.Label,
                Confidence = top?.Score ?? 0,
                Suggestions = suggestions,
            };
        }).OrderByDescending(s => s.EventCount).ToList();
    }

    private static IReadOnlyList<ScrapedImportFieldResolutionDto> BuildNamedFieldResolutions(
        Dictionary<string, int> labels,
        IReadOnlyList<NamedRow> targets,
        Func<string, NamedRow, float> scoreFn)
    {
        return labels.Select(pair =>
        {
            var suggestions = targets
                .Select(t => new { Row = t, Score = scoreFn(pair.Key, t) })
                .Where(x => x.Score > 0.2f)
                .OrderByDescending(x => x.Score)
                .Take(5)
                .Select(x => new ScrapedImportSuggestionDto
                {
                    Id = x.Row.Id,
                    Label = x.Row.Name,
                    Score = x.Score,
                })
                .ToList();

            var top = suggestions.FirstOrDefault();
            return new ScrapedImportFieldResolutionDto
            {
                ScrapedLabel = pair.Key,
                EventCount = pair.Value,
                SuggestedTargetId = top?.Id,
                SuggestedTargetLabel = top?.Label,
                Confidence = top?.Score ?? 0,
                Suggestions = suggestions,
            };
        }).OrderByDescending(s => s.EventCount).ToList();
    }

    private static IReadOnlyList<ScrapedImportFieldResolutionDto> BuildProfessorResolutions(
        Dictionary<string, int> labels,
        IReadOnlyList<UserRow> users,
        ScrapedEventResolutionMaps maps,
        IReadOnlyDictionary<string, ScrapedHostAliasDto> hostAliases)
    {
        return labels.Select(pair =>
        {
            var key = NormalizeKey(pair.Key);
            maps.HostByProfessorKey.TryGetValue(key, out var suggestedId);
            ScrapedHostAliasJson.TryGetByLabel(hostAliases, pair.Key, out var alias);

            if (alias?.HostUserId is { } aliasHostId && aliasHostId != Guid.Empty)
                suggestedId = aliasHostId;

            var suggestions = users
                .Select(u =>
                {
                    var display = $"{u.FirstName} {u.LastName}".Trim();
                    var score = ScoreText(pair.Key, display);
                    if (score < 0.35f)
                        score = Math.Max(score, ScoreText(pair.Key, u.Email));
                    return new { u.UserId, display, score };
                })
                .Where(x => x.score >= 0.35f)
                .OrderByDescending(x => x.score)
                .Take(5)
                .Select(x => new ScrapedImportSuggestionDto
                {
                    Id = x.UserId,
                    Label = x.display,
                    Subtitle = users.First(u => u.UserId == x.UserId).Email,
                    Score = x.score,
                })
                .ToList();

            if (suggestedId.HasValue && suggestions.All(s => s.Id != suggestedId))
            {
                var user = users.FirstOrDefault(u => u.UserId == suggestedId);
                if (user != null)
                {
                    suggestions.Insert(0, new ScrapedImportSuggestionDto
                    {
                        Id = user.UserId,
                        Label = $"{user.FirstName} {user.LastName}".Trim(),
                        Subtitle = user.Email,
                        Score = 0.95f,
                    });
                }
            }

            var top = suggestions.FirstOrDefault();
            var confidence = top?.Score ?? (suggestedId.HasValue ? 0.8f : 0);
            if (alias?.HostUserId is { } savedHost && savedHost != Guid.Empty)
                confidence = 1f;

            return new ScrapedImportFieldResolutionDto
            {
                ScrapedLabel = pair.Key,
                EventCount = pair.Value,
                SuggestedTargetId = alias?.HostUserId ?? top?.Id ?? suggestedId,
                SuggestedTargetLabel = alias?.HostDisplayName
                    ?? alias?.PendingDisplayName
                    ?? top?.Label,
                Confidence = confidence,
                Suggestions = suggestions,
            };
        }).OrderByDescending(s => s.EventCount).ToList();
    }

    private static IReadOnlyList<ScrapedImportFieldResolutionDto> BuildRoomFieldResolutions(
        Dictionary<string, int> labels,
        IReadOnlyList<NamedRow> rooms,
        ScrapedEventResolutionMaps maps)
    {
        return labels.Select(pair =>
        {
            var key = NormalizeKey(pair.Key);
            maps.RoomByRoomTextKey.TryGetValue(key, out var suggestedId);

            var suggestions = rooms
                .Select(r => new { r, score = ScoreText(pair.Key, r.Name) })
                .Where(x => x.score >= 0.35f)
                .OrderByDescending(x => x.score)
                .Take(5)
                .Select(x => new ScrapedImportSuggestionDto { Id = x.r.Id, Label = x.r.Name, Score = x.score })
                .ToList();

            if (suggestedId.HasValue && suggestions.All(s => s.Id != suggestedId))
            {
                var room = rooms.FirstOrDefault(r => r.Id == suggestedId);
                if (room != null)
                    suggestions.Insert(0, new ScrapedImportSuggestionDto { Id = room.Id, Label = room.Name, Score = 0.95f });
            }

            var top = suggestions.FirstOrDefault();
            return new ScrapedImportFieldResolutionDto
            {
                ScrapedLabel = pair.Key,
                EventCount = pair.Value,
                SuggestedTargetId = top?.Id ?? suggestedId,
                SuggestedTargetLabel = top?.Label,
                Confidence = top?.Score ?? (suggestedId.HasValue ? 0.8f : 0),
                Suggestions = suggestions,
            };
        }).OrderByDescending(s => s.EventCount).ToList();
    }

    private static IReadOnlyList<ScrapedImportGroupResolutionDto> BuildGroupResolutions(
        Dictionary<string, int> labels,
        IReadOnlyList<GroupRow> groups,
        OrganizationType orgType)
    {
        return labels.Select(pair =>
        {
            var suggestions = groups
                .Select(g => new
                {
                    g,
                    score = ScoreText(pair.Key, g.Name),
                    typeLabel = GroupTypes.GetDisplayLabel(orgType, g.Type),
                })
                .Where(x => x.score >= 0.35f)
                .OrderByDescending(x => x.score)
                .Take(6)
                .Select(x => new ScrapedImportSuggestionDto
                {
                    Id = x.g.Id,
                    Label = x.g.Name,
                    Subtitle = x.typeLabel,
                    Score = x.score,
                })
                .ToList();

            var top = suggestions.FirstOrDefault();
            var suggestedType = top != null
                ? groups.First(g => g.Id == top.Id).Type
                : GuessGroupTypeFromLabel(pair.Key);

            return new ScrapedImportGroupResolutionDto
            {
                ScrapedLabel = pair.Key,
                EventCount = pair.Value,
                SuggestedGroupType = suggestedType,
                SuggestedGroupId = top?.Id,
                SuggestedGroupLabel = top?.Label,
                Suggestions = suggestions,
            };
        }).OrderByDescending(s => s.EventCount).ToList();
    }

    private static string GuessGroupTypeFromLabel(string label)
    {
        if (label.Contains('/', StringComparison.Ordinal))
            return GroupTypes.Subgroup;
        if (Regex.IsMatch(label, @"^\d{3,4}$"))
            return GroupTypes.Group;
        if (Regex.IsMatch(label, @"^I?\d+$", RegexOptions.IgnoreCase))
            return GroupTypes.Series;
        return GroupTypes.Group;
    }

    private static float MatchActivityToEventType(string activity, NamedRow eventType)
    {
        var a = activity.ToLowerInvariant();
        var name = eventType.Name.ToLowerInvariant();
        if (a.Contains("laborator") && (name.Contains("lab") || name.Contains("laborator")))
            return 0.95f;
        if (a.Contains("seminar") && name.Contains("semin"))
            return 0.95f;
        if (a.Contains("curs") && (name.Contains("curs") || name.Contains("lectur")))
            return 0.95f;
        if (a.Contains("proiect") && name.Contains("proiect"))
            return 0.95f;
        if (a.Contains("consult") && name.Contains("consult"))
            return 0.95f;
        if (a.Contains("practic") && name.Contains("practic"))
            return 0.95f;
        return ScoreText(activity, eventType.Name);
    }

    private static List<(Guid? Id, string Label, string? Subtitle, float Score)> ScoreByName(
        IReadOnlyList<(Guid Id, string Name, string? Code)> targets,
        string scraped)
    {
        return targets
            .Select(t =>
            {
                var nameScore = ScoreText(scraped, t.Name);
                var codeScore = string.IsNullOrWhiteSpace(t.Code) ? 0 : ScoreText(scraped, t.Code);
                var score = Math.Max(nameScore, codeScore);
                return ((Guid?)t.Id, t.Name, t.Code, score);
            })
            .Where(x => x.score >= 0.35f)
            .OrderByDescending(x => x.score)
            .Select(x => (x.Item1, x.Name, x.Code, x.score))
            .ToList();
    }

    private static float ScoreText(string a, string b)
    {
        if (string.IsNullOrWhiteSpace(a) || string.IsNullOrWhiteSpace(b))
            return 0;

        var x = NormalizeKey(a);
        var y = NormalizeKey(b);
        if (x == y)
            return 1f;
        if (x.Contains(y, StringComparison.Ordinal) || y.Contains(x, StringComparison.Ordinal))
            return 0.82f;

        var tokensA = x.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var tokensB = y.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var overlap = tokensA.Count(t => tokensB.Contains(t, StringComparer.Ordinal));
        if (overlap == 0)
            return 0.2f;
        return Math.Min(0.78f, overlap / (float)Math.Max(tokensA.Length, tokensB.Length));
    }

    private static string NormalizeKey(string value) =>
        string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();

    private sealed record OfferingRow(Guid Id, string Name, string? Code);

    private sealed record NamedRow(Guid Id, string Name);

    private sealed record GroupRow(Guid Id, string Name, string Type);

    private sealed record UserRow(Guid UserId, string FirstName, string LastName, string Email);
}
