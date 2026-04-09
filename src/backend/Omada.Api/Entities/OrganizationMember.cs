namespace Omada.Api.Entities;

// Note: Does NOT inherit BaseEntity because it uses a Composite Key (OrgId + UserId)
public class OrganizationMember
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; } 
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // EF Core Navigation Properties
    public virtual Organization Organization { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual Role Role { get; set; } = null!;
}