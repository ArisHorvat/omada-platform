namespace Omada.Api.Entities;

/// <summary>
/// Term-scoped course/subject instance (e.g. Linear Algebra — Fall 2026).
/// Stable cohort groups enroll here; schedule and coursework attach to offerings, not duplicated group trees.
/// </summary>
public class CourseOffering : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid PeriodId { get; set; }

    /// <summary>Program/year track this offering belongs to (stable group tree).</summary>
    public Guid? ProgramGroupId { get; set; }

    /// <summary>Optional link to a catalog subject group in the stable tree.</summary>
    public Guid? SubjectCatalogGroupId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Code { get; set; }

    public string? Description { get; set; }

    /// <summary>Credit hours for transcript / GPA weighting (0 when not set).</summary>
    public decimal Credits { get; set; }

    /// <summary>Minimum attendance rate (0–100) required to pass; null = no rule.</summary>
    public decimal? RequiredAttendancePercent { get; set; }

    /// <summary>When timetable was last published from <see cref="WeeklySessionPlanJson"/>.</summary>
    public DateTime? TimetablePublishedAt { get; set; }

    /// <summary>JSON array of <see cref="Guid"/> — schedule event ids created by timetable publish (for replace).</summary>
    public string? TimetablePublishedEventIdsJson { get; set; }

    /// <summary>Default instructor for this offering.</summary>
    public Guid? HostId { get; set; }

    /// <summary>JSON array of <see cref="DTOs.Offerings.OfferingWeeklySessionDto"/> — weekly activity pattern (lecture, lab, seminar).</summary>
    public string? WeeklySessionPlanJson { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual OrganizationPeriod Period { get; set; } = null!;

    public virtual Group? ProgramGroup { get; set; }

    public virtual Group? SubjectCatalogGroup { get; set; }

    public virtual User? Host { get; set; }

    public virtual ICollection<OfferingEnrollment> Enrollments { get; set; } = new List<OfferingEnrollment>();

    public virtual ICollection<CourseOfferingProgram> Programs { get; set; } = new List<CourseOfferingProgram>();

    public virtual ICollection<OfferingInstructor> Instructors { get; set; } = new List<OfferingInstructor>();
}
