using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Announcements;

public class AnnouncementCommentDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public Guid PostId { get; set; }

    [Required]
    public Guid AuthorId { get; set; }

    [Required]
    public string AuthorName { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; }
}
