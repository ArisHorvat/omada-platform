using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Announcements;

public class AnnouncementChannelDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public AnnouncementChannelKind Kind { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public Guid? GroupId { get; set; }

    public Guid? CourseOfferingId { get; set; }

    public DateTime? LastPostAt { get; set; }

    [Required]
    public int UnreadCount { get; set; }
}
