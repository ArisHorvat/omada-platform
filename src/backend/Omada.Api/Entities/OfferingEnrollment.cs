namespace Omada.Api.Entities;

/// <summary>
/// Student (or staff) enrolled in a term offering. Cohort membership is stable; enrollment is per period/offering.
/// </summary>
public class OfferingEnrollment : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid OfferingId { get; set; }

    public Guid UserId { get; set; }

    /// <summary>Cohort group at enrollment time (stable academic-year group).</summary>
    public Guid? CohortGroupId { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOffering Offering { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual Group? CohortGroup { get; set; }
}
