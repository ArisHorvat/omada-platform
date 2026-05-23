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
}
