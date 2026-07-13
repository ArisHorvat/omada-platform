namespace Omada.Api.Entities;

public class CourseOfferingPackageItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid PackageId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Code { get; set; }

    public string? Description { get; set; }

    public int SortOrder { get; set; }

    /// <summary>Default lead instructor when the package is applied to a term.</summary>
    public Guid? DefaultHostId { get; set; }

    /// <summary>JSON array of <see cref="DTOs.Offerings.OfferingInstructorInputDto"/> for host + teaching team.</summary>
    public string? InstructorsJson { get; set; }

    /// <summary>JSON array of <see cref="DTOs.Offerings.OfferingWeeklySessionDto"/> — copied to term offerings on apply.</summary>
    public string? WeeklySessionPlanJson { get; set; }

    /// <summary>Transcript credits applied when the package is applied to a term.</summary>
    public decimal Credits { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOfferingPackage Package { get; set; } = null!;

    public virtual User? DefaultHost { get; set; }

    /// <summary>When set, overrides package-level programs for this course (e.g. shared Linear Algebra for CS + AI).</summary>
    public virtual ICollection<CourseOfferingPackageItemProgram> Programs { get; set; } =
        new List<CourseOfferingPackageItemProgram>();
}
