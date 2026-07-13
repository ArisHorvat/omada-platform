using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

/// <summary>
/// Output shape from the HTML table extractor (spider). Not mapped to EF; used before merge into <see cref="Entities.ScrapedClassEvent"/>.
/// </summary>
public class ScrapedEventDto
{
    [Required]
    public string ClassName { get; set; } = string.Empty;

    [Required]
    public string Time { get; set; } = string.Empty;

    [Required]
    public string Room { get; set; } = string.Empty;

    [Required]
    public string Professor { get; set; } = string.Empty;

    [Required]
    public string GroupNumber { get; set; } = string.Empty;

    /// <summary>Session kind from timetable (e.g. Curs, Laborator, Seminar).</summary>
    [Required]
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>Year/specialization page URL this row was scraped from (multi-page crawl).</summary>
    public string? SourcePageUrl { get; set; }

    /// <summary>Raw day column before normalization (optional).</summary>
    public string? DayLabel { get; set; }

    /// <summary>Raw hours column (e.g. 08:00–10:00).</summary>
    public string? HoursLabel { get; set; }

    /// <summary>Raw frequency column (e.g. saptamanal, par).</summary>
    public string? FrequencyLabel { get; set; }

    /// <summary>.NET day-of-week (0=Sunday … 6=Saturday) when parsed.</summary>
    public int? DayOfWeek { get; set; }

    /// <summary>Local start time HH:mm when parsed.</summary>
    public string? StartTimeLocal { get; set; }

    /// <summary>Session length in hours when parsed from a time range.</summary>
    public decimal? HoursPerSession { get; set; }

    /// <summary>Omada frequency token: weekly, biweekly, monthly, as_needed.</summary>
    public string? Frequency { get; set; }

    /// <summary>When <see cref="Frequency"/> is biweekly: 1 = odd term weeks, 2 = even term weeks (sapt. 1 / sapt. 2).</summary>
    public int? BiweeklyPhase { get; set; }

    /// <summary>True when day, start time, and duration were parsed successfully.</summary>
    public bool TimeParsed { get; set; }

    /// <summary>Present when <see cref="TimeParsed"/> is false.</summary>
    public string? TimeParseWarning { get; set; }
}
