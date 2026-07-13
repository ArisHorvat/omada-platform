using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Announcements;

public class AnnouncementPostDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public Guid ChannelId { get; set; }

    [Required]
    public AnnouncementChannelKind ChannelKind { get; set; }

    [Required]
    public string ChannelName { get; set; } = string.Empty;

    [Required]
    public Guid AuthorId { get; set; }

    [Required]
    public string AuthorName { get; set; } = string.Empty;

    public string? Title { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public string? CoverImageUrl { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CommentCount { get; set; }
}
