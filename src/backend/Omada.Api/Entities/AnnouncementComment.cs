namespace Omada.Api.Entities;

public class AnnouncementComment : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;

    public virtual Organization Organization { get; set; } = null!;
    public virtual AnnouncementPost Post { get; set; } = null!;
    public virtual User Author { get; set; } = null!;
}
