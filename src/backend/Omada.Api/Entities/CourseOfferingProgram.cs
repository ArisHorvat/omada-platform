namespace Omada.Api.Entities;

/// <summary>Term offering may serve multiple programs (e.g. Linear Algebra for CS and AI).</summary>
public class CourseOfferingProgram : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid OfferingId { get; set; }

    public Guid ProgramGroupId { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOffering Offering { get; set; } = null!;

    public virtual Group ProgramGroup { get; set; } = null!;
}
