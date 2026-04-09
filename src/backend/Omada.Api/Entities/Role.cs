namespace Omada.Api.Entities;

public class Role : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;

    // EF Core Navigation Properties
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<RolePermission> Permissions { get; set; } = new List<RolePermission>();
    public virtual ICollection<OrganizationMember> Members { get; set; } = new List<OrganizationMember>();
}