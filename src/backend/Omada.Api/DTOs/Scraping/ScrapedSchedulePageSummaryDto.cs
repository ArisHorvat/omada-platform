using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

public class ScrapedSchedulePageSummaryDto
{
    [Required]
    public required string SourceUrl { get; init; }

    [Required]
    public required int EventCount { get; init; }

    [Required]
    public SpiderPageKind PageKind { get; init; }
}
