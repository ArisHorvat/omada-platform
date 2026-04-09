namespace Omada.Api.Entities;

/// <summary>
/// Read-tracking join table between User and NewsItem.
/// </summary>
public class UserNewsRead : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid NewsItemId { get; set; }
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
    public virtual NewsItem NewsItem { get; set; } = null!;
}
