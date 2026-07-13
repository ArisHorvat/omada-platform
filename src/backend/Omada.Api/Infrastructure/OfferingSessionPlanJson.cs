using System.Text.Json;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Infrastructure;

public static class OfferingSessionPlanJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static IReadOnlyList<OfferingWeeklySessionDto> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Array.Empty<OfferingWeeklySessionDto>();

        try
        {
            var list = JsonSerializer.Deserialize<List<OfferingWeeklySessionDto>>(json, Options);
            return Normalize(list ?? new List<OfferingWeeklySessionDto>());
        }
        catch (JsonException)
        {
            return Array.Empty<OfferingWeeklySessionDto>();
        }
    }

    public static string? Serialize(IReadOnlyList<OfferingWeeklySessionDto>? sessions)
    {
        if (sessions == null || sessions.Count == 0)
            return null;

        return JsonSerializer.Serialize(Normalize(sessions.ToList()), Options);
    }

    /// <summary>Stable normalized JSON for comparing pattern edits since last publish.</summary>
    public static string? CanonicalSnapshot(string? weeklySessionPlanJson)
    {
        var sessions = Parse(weeklySessionPlanJson)
            .Where(s => s.EventTypeId.HasValue && s.Frequency != "as_needed")
            .ToList();
        return sessions.Count == 0 ? null : Serialize(sessions);
    }

    public static bool PatternChangedSincePublish(string? currentPlanJson, string? publishedPlanJson, DateTime? publishedAt, DateTime? updatedAt)
    {
        var current = CanonicalSnapshot(currentPlanJson);
        if (current == null || !publishedAt.HasValue)
            return false;

        if (!string.IsNullOrWhiteSpace(publishedPlanJson))
            return !string.Equals(current, publishedPlanJson, StringComparison.Ordinal);

        // Legacy rows published before plan snapshots: pattern saved after publish.
        return updatedAt.HasValue && updatedAt.Value > publishedAt.Value.AddSeconds(2);
    }

    public static List<OfferingWeeklySessionDto> Normalize(List<OfferingWeeklySessionDto> sessions)
    {
        var sort = 0;
        return sessions
            .Where(s => s.HoursPerSession > 0)
            .Select(s => new OfferingWeeklySessionDto
            {
                EventTypeId = s.EventTypeId,
                EventTypeName = string.IsNullOrWhiteSpace(s.EventTypeName) ? null : s.EventTypeName.Trim(),
                HoursPerSession = s.HoursPerSession,
                Frequency = NormalizeFrequency(s.Frequency),
                BiweeklyPhase = NormalizeBiweeklyPhase(s.Frequency, s.BiweeklyPhase),
                IsOptional = s.IsOptional,
                SortOrder = s.SortOrder > 0 ? s.SortOrder : sort++,
                DayOfWeek = NormalizeDayOfWeek(s.DayOfWeek),
                StartTimeLocal = NormalizeStartTimeLocal(s.StartTimeLocal),
                HostId = s.HostId,
                HostName = string.IsNullOrWhiteSpace(s.HostName) ? null : s.HostName.Trim(),
                RoomId = s.RoomId,
                RoomName = string.IsNullOrWhiteSpace(s.RoomName) ? null : s.RoomName.Trim(),
                RequiredAttendancePercent = s.RequiredAttendancePercent is >= 0 and <= 100 ? s.RequiredAttendancePercent : null,
                AssignedInstructorIds = s.AssignedInstructorIds?
                    .Where(id => id != Guid.Empty)
                    .Distinct()
                    .ToList(),
                AudienceScope = NormalizeAudienceScope(s.AudienceScope),
                CohortGroupIds = NormalizeCohortIds(s),
                CohortDelivery = NormalizeCohortDelivery(s.CohortDelivery),
                CohortAssignments = NormalizeAssignments(s)
            })
            .OrderBy(s => s.SortOrder)
            .ToList();
    }

    private static List<Guid>? NormalizeCohortIds(OfferingWeeklySessionDto s)
    {
        if (NormalizeAudienceScope(s.AudienceScope) != "selected")
            return null;

        if (s.CohortAssignments?.Count > 0)
        {
            return s.CohortAssignments
                .SelectMany(a => a.CohortGroupIds ?? [])
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();
        }

        return s.CohortGroupIds?.Where(id => id != Guid.Empty).Distinct().ToList();
    }

    private static List<OfferingSessionCohortAssignmentDto>? NormalizeAssignments(OfferingWeeklySessionDto s)
    {
        if (NormalizeAudienceScope(s.AudienceScope) != "selected")
            return null;

        if (s.CohortAssignments == null || s.CohortAssignments.Count == 0)
            return null;

        var claimed = new HashSet<Guid>();
        var result = new List<OfferingSessionCohortAssignmentDto>();

        foreach (var a in s.CohortAssignments)
        {
            var ids = a.CohortGroupIds?
                .Where(id => id != Guid.Empty && !claimed.Contains(id))
                .Distinct()
                .ToList() ?? new List<Guid>();

            foreach (var id in ids)
                claimed.Add(id);

            if (ids.Count == 0)
                continue;

            result.Add(new OfferingSessionCohortAssignmentDto
            {
                HostId = a.HostId,
                HostName = string.IsNullOrWhiteSpace(a.HostName) ? null : a.HostName.Trim(),
                CohortGroupIds = ids,
                DayOfWeek = a.DayOfWeek is >= 0 and <= 6 ? a.DayOfWeek : null,
                StartTimeLocal = string.IsNullOrWhiteSpace(a.StartTimeLocal) ? null : NormalizeStartTimeLocal(a.StartTimeLocal),
                RoomId = a.RoomId,
                RoomName = string.IsNullOrWhiteSpace(a.RoomName) ? null : a.RoomName.Trim(),
                Frequency = NormalizeFrequency(a.Frequency ?? s.Frequency),
                BiweeklyPhase = NormalizeBiweeklyPhase(a.Frequency ?? s.Frequency, a.BiweeklyPhase ?? s.BiweeklyPhase),
            });
        }

        return result.Count > 0 ? result : null;
    }

    public static string NormalizeFrequency(string? frequency)
    {
        var f = (frequency ?? "weekly").Trim().ToLowerInvariant();
        return f switch
        {
            "weekly" => "weekly",
            "biweekly" or "every_two_weeks" or "every-2-weeks" => "biweekly",
            "monthly" => "monthly",
            "as_needed" or "as-needed" or "optional" => "as_needed",
            _ => "weekly"
        };
    }

    public static int? NormalizeBiweeklyPhase(string? frequency, int? phase)
    {
        if (NormalizeFrequency(frequency) != "biweekly")
            return null;

        return phase is 1 or 2 ? phase : 1;
    }

    public static int NormalizeDayOfWeek(int? day) =>
        day is >= 0 and <= 6 ? day.Value : 1;

    public static string NormalizeStartTimeLocal(string? time)
    {
        if (string.IsNullOrWhiteSpace(time))
            return "09:00";

        var parts = time.Trim().Split(':');
        if (parts.Length < 2)
            return "09:00";

        if (!int.TryParse(parts[0], out var h) || !int.TryParse(parts[1], out var m))
            return "09:00";

        h = Math.Clamp(h, 0, 23);
        m = Math.Clamp(m, 0, 59);
        m = m / 15 * 15;
        return $"{h:D2}:{m:D2}";
    }

    public static string NormalizeAudienceScope(string? scope)
    {
        var s = (scope ?? "all").Trim().ToLowerInvariant();
        return s == "selected" ? "selected" : "all";
    }

    public static string NormalizeCohortDelivery(string? delivery)
    {
        var d = (delivery ?? "split").Trim().ToLowerInvariant();
        return d == "combined" ? "combined" : "split";
    }

    /// <summary>
    /// Curriculum package activities — type, hours, eligible instructors, attendance rules only (no timetable slots).
    /// </summary>
    public static List<OfferingWeeklySessionDto> NormalizePackageActivities(List<OfferingWeeklySessionDto> sessions)
    {
        var sort = 0;
        return sessions
            .Where(s => s.HoursPerSession > 0)
            .Select(s => new OfferingWeeklySessionDto
            {
                EventTypeId = s.EventTypeId,
                EventTypeName = string.IsNullOrWhiteSpace(s.EventTypeName) ? null : s.EventTypeName.Trim(),
                HoursPerSession = s.HoursPerSession,
                Frequency = NormalizeFrequency(s.Frequency),
                BiweeklyPhase = NormalizeBiweeklyPhase(s.Frequency, s.BiweeklyPhase),
                IsOptional = s.IsOptional,
                SortOrder = s.SortOrder > 0 ? s.SortOrder : sort++,
                RequiredAttendancePercent = s.RequiredAttendancePercent is >= 0 and <= 100 ? s.RequiredAttendancePercent : null,
                AssignedInstructorIds = s.AssignedInstructorIds?
                    .Where(id => id != Guid.Empty)
                    .Distinct()
                    .ToList(),
                AudienceScope = "all",
                CohortDelivery = "split",
            })
            .OrderBy(s => s.SortOrder)
            .ToList();
    }
}
