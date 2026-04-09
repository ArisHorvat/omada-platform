using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Rooms;

public class CreateFloorRequest
{
    [Required]
    [Range(1, 300)]
    public int LevelNumber { get; set; }

    [Required]
    public IFormFile FloorplanFile { get; set; } = null!;
}

