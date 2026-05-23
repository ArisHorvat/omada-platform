using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

public class SpiderPreviewNewsResultDto
{
    [Required]
    public required string SourceUrl { get; init; }

    [Required]
    public required ExtractedNewsArticleDto Article { get; init; }
}
