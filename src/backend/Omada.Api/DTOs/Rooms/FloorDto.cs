using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Rooms;

public class FloorDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public Guid BuildingId { get; set; }

    [Required]
    public int LevelNumber { get; set; }

    public string? FloorplanImageUrl { get; set; }

    /// <summary>When set, AI-processed floorplan GeoJSON is available via <c>GET /api/floorplans/{id}</c>.</summary>
    public Guid? FloorplanId { get; set; }

    [Required]
    public List<MapPinDto> Pins { get; set; } = new();
}
