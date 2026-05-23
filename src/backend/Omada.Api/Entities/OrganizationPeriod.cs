namespace Omada.Api.Entities;

/// <summary>
/// Academic or operational period for an organization (semester, sprint, quarter).
/// </summary>
public class OrganizationPeriod : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
