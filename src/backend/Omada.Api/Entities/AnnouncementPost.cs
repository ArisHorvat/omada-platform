namespace Omada.Api.Entities;

/// <summary>
/// A post in an announcement channel — optional title for broadcast-style updates, or content-only for chat-style messages.
/// </summary>
public class AnnouncementPost : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid ChannelId { get; set; }
    public Guid AuthorId { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual AnnouncementChannel Channel { get; set; } = null!;
    public virtual User Author { get; set; } = null!;
}
