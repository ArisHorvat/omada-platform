using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

public class SpiderPreviewScheduleResultDto
{
    [Required]
    public required string SourceUrl { get; init; }

    [Required]
    public required IReadOnlyList<ScrapedEventDto> Events { get; init; }

    [Required]
    public required int EventCount { get; init; }

    [Required]
    public required bool CrawledMultiplePages { get; init; }

    [Required]
    public required IReadOnlyList<ScrapedSchedulePageSummaryDto> Pages { get; init; }

    [Required]
    public required int HubLinksDiscovered { get; init; }

    [Required]
    public required int SchedulePagesScraped { get; init; }

    [Required]
    public required bool WasTruncated { get; init; }

    [Required]
    public required int ParsedTimeCount { get; init; }

    [Required]
    public required int UnparsedTimeCount { get; init; }
}
