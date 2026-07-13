namespace Omada.Api.Entities;

/// <summary>
/// Per-user read cursor for an announcement channel (used for unread badges).
/// </summary>
public class UserAnnouncementChannelRead : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public Guid ChannelId { get; set; }
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;

    public virtual Organization Organization { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual AnnouncementChannel Channel { get; set; } = null!;
}
