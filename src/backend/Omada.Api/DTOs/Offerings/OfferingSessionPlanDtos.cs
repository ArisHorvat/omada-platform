using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

/// <summary>
/// One recurring activity slot in a course offering (lecture, lab, seminar, etc.).
/// </summary>
public class OfferingWeeklySessionDto
{
    public Guid? EventTypeId { get; set; }

    public string? EventTypeName { get; set; }

    /// <summary>Contact hours per occurrence (e.g. 1.5 for a 90-minute lab).</summary>
    [Required]
    public required decimal HoursPerSession { get; set; }

    /// <summary>weekly | biweekly | monthly | as_needed</summary>
    [Required]
    public required string Frequency { get; set; }

    /// <summary>When frequency is biweekly: 1 = odd term weeks (sapt. 1), 2 = even term weeks (sapt. 2).</summary>
    public int? BiweeklyPhase { get; set; }

    /// <summary>When true, the session is optional (e.g. drop-in seminar).</summary>
    public bool IsOptional { get; set; }

    public int SortOrder { get; set; }

    /// <summary>0 = Sunday … 6 = Saturday (matches <see cref="DayOfWeek"/>).</summary>
    public int? DayOfWeek { get; set; }

    /// <summary>Wall-clock start time for timetable publish (HH:mm, 24h).</summary>
    public string? StartTimeLocal { get; set; }

    /// <summary>Instructor for this activity (defaults to offering host when null).</summary>
    public Guid? HostId { get; set; }

    public string? HostName { get; set; }

    /// <summary>all = every enrolled student; selected = <see cref="CohortGroupIds"/>.</summary>
    public string AudienceScope { get; set; } = "all";

    /// <summary>Cohort / subgroup ids when <see cref="AudienceScope"/> is selected.</summary>
    public List<Guid>? CohortGroupIds { get; set; }

    /// <summary>split = one schedule event per subgroup; combined = one event for all selected subgroups.</summary>
    public string CohortDelivery { get; set; } = "split";

    /// <summary>
    /// When set, each block assigns an instructor to a subset of groups for this same activity
    /// (e.g. seminar: 2 subgroups with teacher A, 3 with teacher B).
    /// </summary>
    public List<OfferingSessionCohortAssignmentDto>? CohortAssignments { get; set; }

    public Guid? RoomId { get; set; }

    public string? RoomName { get; set; }

    /// <summary>Minimum attendance % required for this activity type (university).</summary>
    public decimal? RequiredAttendancePercent { get; set; }

    /// <summary>
    /// Teaching-team members allowed to run this activity (subset of offering instructors).
    /// Timetable publish picks concrete host(s) per slot from this pool.
    /// </summary>
    public List<Guid>? AssignedInstructorIds { get; set; }
}
