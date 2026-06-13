namespace Omada.Api.Entities;

/// <summary>Corporate employee workday clock in/out with break tracking.</summary>
public class WorkTimeEntry : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid UserId { get; set; }

    /// <summary>Calendar day for this entry (UTC date).</summary>
    public DateTime WorkDate { get; set; }

    public DateTime? ClockInUtc { get; set; }

    public DateTime? ClockOutUtc { get; set; }

    public int BreakMinutes { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
