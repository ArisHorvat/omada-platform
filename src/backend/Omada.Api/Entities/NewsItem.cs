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

    /// <summary>Original article URL when imported via web spider (dedup key).</summary>
    public string? SourceUrl { get; set; }

    /// <summary>Hash of normalized title + content for change detection on re-sync.</summary>
    public string? SourceContentHash { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual User Author { get; set; } = null!;
}