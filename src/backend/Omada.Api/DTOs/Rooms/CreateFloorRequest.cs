using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Rooms;

public class CreateFloorRequest
{
    [Required]
    [Range(1, 300)]
    public int LevelNumber { get; set; }

    /// <summary>Optional floorplan image. When omitted, the level is created without a raster map (rooms can still be added as a list).</summary>
    public IFormFile? FloorplanFile { get; set; }
}

