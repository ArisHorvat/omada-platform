using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

public class SpiderSyncEnqueueResultDto
{
    [Required]
    public required string JobId { get; init; }

    [Required]
    public required string Message { get; init; }
}
