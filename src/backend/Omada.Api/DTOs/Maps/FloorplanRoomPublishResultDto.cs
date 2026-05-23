using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Maps;

public class FloorplanRoomPublishResultDto
{
    [Required]
    public int CreatedCount { get; set; }

    [Required]
    public int UpdatedCount { get; set; }

    [Required]
    public int SkippedCount { get; set; }
}
