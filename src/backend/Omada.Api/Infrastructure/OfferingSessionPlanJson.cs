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
                IsOptional = s.IsOptional,
                SortOrder = s.SortOrder > 0 ? s.SortOrder : sort++,
                DayOfWeek = NormalizeDayOfWeek(s.DayOfWeek),
                StartTimeLocal = NormalizeStartTimeLocal(s.StartTimeLocal)
            })
            .OrderBy(s => s.SortOrder)
            .ToList();
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
}
