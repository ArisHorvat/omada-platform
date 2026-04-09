namespace Omada.Api.Entities;

public class Message : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty; // Cached display name
    public string Content { get; set; } = string.Empty;

    public virtual Organization Organization { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}