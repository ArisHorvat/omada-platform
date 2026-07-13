using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Infrastructure.Scraping;

/// <summary>
/// Removes duplicate timetable rows from spider extraction (e.g. nested tables parsed twice).
/// Does not merge rows across study groups — each group keeps its own schedule rows.
/// </summary>
public static class ScrapedScheduleDedup
{
    /// <summary>Remove identical rows (same page, fields, and group).</summary>
    public static List<ScrapedEventDto> RemoveExactDuplicates(IEnumerable<ScrapedEventDto> events)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<ScrapedEventDto>();

        foreach (var e in events)
        {
            if (seen.Add(ExactKey(e)))
                result.Add(e);
        }

        return result;
    }

    public static List<ScrapedEventDto> CleanForPreview(IEnumerable<ScrapedEventDto> events) =>
        RemoveExactDuplicates(events);

    private static string ExactKey(ScrapedEventDto e) =>
        string.Join('\u001f',
            Normalize(e.SourcePageUrl),
            Normalize(e.ClassName),
            Normalize(e.ActivityType),
            Normalize(e.Time),
            Normalize(e.DayLabel),
            Normalize(e.HoursLabel),
            Normalize(e.FrequencyLabel),
            Normalize(e.Room),
            Normalize(e.Professor),
            Normalize(e.GroupNumber));

    private static string Normalize(string? value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();
}
