namespace Omada.Api.Entities;

public class CourseOfferingPackageItemProgram : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid PackageItemId { get; set; }

    public Guid ProgramGroupId { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOfferingPackageItem PackageItem { get; set; } = null!;

    public virtual Group ProgramGroup { get; set; } = null!;
}
