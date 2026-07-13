namespace Omada.Api.Entities;

public enum AnnouncementChannelKind : byte
{
    General = 0,
    Group = 1,
    CourseOffering = 2
}

/// <summary>
/// Scoped communication channel — general org-wide, per group, or per term offering (coursework).
/// </summary>
public class AnnouncementChannel : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public AnnouncementChannelKind Kind { get; set; }
    public Guid? GroupId { get; set; }
    public Guid? CourseOfferingId { get; set; }
    public string DisplayName { get; set; } = string.Empty;

    public virtual Organization Organization { get; set; } = null!;
    public virtual Group? Group { get; set; }
    public virtual CourseOffering? CourseOffering { get; set; }
    public virtual ICollection<AnnouncementPost> Posts { get; set; } = new List<AnnouncementPost>();
}
