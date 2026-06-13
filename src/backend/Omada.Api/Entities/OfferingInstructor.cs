using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Entities;

public class OfferingInstructor : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid OfferingId { get; set; }

    public Guid UserId { get; set; }

    /// <see cref="OfferingInstructorRoles"/>
    public string Role { get; set; } = OfferingInstructorRoles.CoInstructor;

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOffering Offering { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
