using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Tasks;

public class TaskAttachmentDto
{
    [Required]
    public required string Url { get; set; }

    public string? FileName { get; set; }

    public string? ContentType { get; set; }

    /// <summary>material | submission | feedback</summary>
    public string Kind { get; set; } = "material";

    public DateTime? UploadedAt { get; set; }

    public Guid? UploadedByUserId { get; set; }
}
