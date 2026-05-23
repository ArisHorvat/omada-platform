namespace Omada.Api.Entities;

public class AuditLog : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string? DetailsJson { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual User ActorUser { get; set; } = null!;
}
