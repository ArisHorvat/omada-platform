using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Infrastructure.Scraping;

public static class ScrapedScheduleNormalizer
{
    public static ScrapedEventDto Enrich(ScrapedEventDto dto)
    {
        var parsed = ScheduleTimeParser.Parse(
            dto.Time,
            dto.DayLabel,
            dto.HoursLabel,
            dto.FrequencyLabel);

        dto.DayOfWeek = parsed.DayOfWeek;
        dto.StartTimeLocal = parsed.StartTimeLocal;
        dto.HoursPerSession = parsed.HoursPerSession;
        dto.Frequency = parsed.Frequency;
        dto.BiweeklyPhase = parsed.BiweeklyPhase;
        dto.TimeParsed = parsed.Parsed;
        dto.TimeParseWarning = parsed.Warning;

        if (string.IsNullOrWhiteSpace(dto.DayLabel))
            dto.DayLabel = parsed.DayLabel;
        if (string.IsNullOrWhiteSpace(dto.HoursLabel))
            dto.HoursLabel = parsed.HoursLabel;
        if (string.IsNullOrWhiteSpace(dto.FrequencyLabel))
            dto.FrequencyLabel = parsed.FrequencyLabel;

        return dto;
    }

    public static List<ScrapedEventDto> EnrichAll(IEnumerable<ScrapedEventDto> events) =>
        events.Select(e => Enrich(e)).ToList();

    public static (int Parsed, int Unparsed) CountParseResults(IReadOnlyList<ScrapedEventDto> events)
    {
        var parsed = events.Count(e => e.TimeParsed);
        return (parsed, events.Count - parsed);
    }
}
