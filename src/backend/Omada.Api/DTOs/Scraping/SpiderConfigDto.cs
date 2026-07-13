using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

/// <summary>Configured schedule import URL for the active organization (saved in DB; appsettings is fallback only).</summary>
public class SpiderConfigDto
{
    [Required]
    public required string SchedulePageUrl { get; init; }

    [Required]
    public required bool HasSchedulePageUrl { get; init; }

    [Required]
    public required bool IsSavedInDatabase { get; init; }
}
