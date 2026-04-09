using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Maps;

public class FloorplanDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public Guid FloorId { get; set; }

    /// <summary>Public URL for the floorplan image.</summary>
    [Required]
    public string ImageUrl { get; set; } = null!;

    /// <summary>GeoJSON payload (stringified JSON).</summary>
    [Required]
    public string GeoJsonData { get; set; } = null!;
}
