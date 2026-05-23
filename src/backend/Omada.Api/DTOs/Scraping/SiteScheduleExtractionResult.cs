using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

public class SiteScheduleExtractionResult
{
    [Required]
    public required string StartUrl { get; init; }

    [Required]
    public required IReadOnlyList<ScrapedEventDto> Events { get; init; }

    [Required]
    public required IReadOnlyList<ScrapedSchedulePageSummaryDto> Pages { get; init; }

    [Required]
    public required bool CrawledMultiplePages { get; init; }

    [Required]
    public required int HubLinksDiscovered { get; init; }

    [Required]
    public required int SchedulePagesScraped { get; init; }

    [Required]
    public required bool WasTruncated { get; init; }
}
