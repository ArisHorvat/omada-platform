using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Maps;

public class UploadFloorplanRequest
{
    [Required]
    public Guid FloorId { get; set; }

    [Required]
    public IFormFile File { get; set; } = null!;
}
