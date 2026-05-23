using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Search;

public class SearchHitDto
{
    [Required]
    public required string Id { get; set; }

    [Required]
    public required string Type { get; set; }

    [Required]
    public required string Title { get; set; }

    public string? Subtitle { get; set; }

    public string? ImageUrl { get; set; }

    /// <summary>Expo-router path the mobile client can navigate to.</summary>
    [Required]
    public required string Route { get; set; }
}
