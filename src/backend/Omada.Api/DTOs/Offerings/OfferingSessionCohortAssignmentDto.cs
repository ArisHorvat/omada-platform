namespace Omada.Api.DTOs.Offerings;

/// <summary>
/// One instructor responsible for a set of cohort / subgroup ids within a single weekly activity.
/// </summary>
public class OfferingSessionCohortAssignmentDto
{
    public Guid? HostId { get; set; }

    public string? HostName { get; set; }

    public List<Guid> CohortGroupIds { get; set; } = new();

    /// <summary>Override day for this instructor block (defaults to session day).</summary>
    public int? DayOfWeek { get; set; }

    /// <summary>Override start time for this block (HH:mm).</summary>
    public string? StartTimeLocal { get; set; }

    public Guid? RoomId { get; set; }

    public string? RoomName { get; set; }

    /// <summary>Override frequency for this block (defaults to session frequency).</summary>
    public string? Frequency { get; set; }

    /// <summary>When biweekly: 1 = odd term weeks, 2 = even term weeks.</summary>
    public int? BiweeklyPhase { get; set; }
}
