namespace Omada.Api.Entities;

/// <summary>Default target programs for all items in a package unless an item has its own program list.</summary>
public class CourseOfferingPackageProgram : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid PackageId { get; set; }

    public Guid ProgramGroupId { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOfferingPackage Package { get; set; } = null!;

    public virtual Group ProgramGroup { get; set; } = null!;
}
