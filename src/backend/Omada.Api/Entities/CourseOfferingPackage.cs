namespace Omada.Api.Entities;

/// <summary>
/// Reusable curriculum package (e.g. Year 1 Fall core) — applied to a term to create offerings.
/// </summary>
public class CourseOfferingPackage : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<CourseOfferingPackageItem> Items { get; set; } = new List<CourseOfferingPackageItem>();

    public virtual ICollection<CourseOfferingPackageProgram> Programs { get; set; } = new List<CourseOfferingPackageProgram>();
}
