namespace Omada.Api.Entities;

public class NewsItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NewsType Type { get; set; } = NewsType.Announcement;
    public NewsCategory Category { get; set; } = NewsCategory.General;
    public string? CoverImageUrl { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual User Author { get; set; } = null!;
}