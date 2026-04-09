namespace Omada.Api.Entities;

/// <summary>
/// Persisted row from the university timetable spider (thesis pipeline). Separate from <see cref="Event"/>,
/// which models the in-app schedule/calendar.
/// </summary>
public class ScrapedClassEvent : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    /// <summary>Course or activity label as read from the HTML table.</summary>
    public string ClassName { get; set; } = string.Empty;

    /// <summary>Raw time cell (e.g. &quot;08:00–10:00&quot; or day+time) before normalization.</summary>
    public string Time { get; set; } = string.Empty;

    /// <summary>Raw room label from the timetable (column name in DB remains <c>Room</c>).</summary>
    public string RoomText { get; set; } = string.Empty;

    public string Professor { get; set; } = string.Empty;
    public string GroupNumber { get; set; } = string.Empty;

    /// <summary>Hash of normalized fields for change detection (populated by merge/spider steps).</summary>
    public string DataHash { get; set; } = string.Empty;

    /// <summary>Set when scraped data differs from the last stored snapshot for this row.</summary>
    public bool IsChanged { get; set; }

    /// <summary>Resolved <see cref="User"/> for <see cref="Professor"/> (entity resolution; host = uni or corporate).</summary>
    public Guid? HostId { get; set; }

    /// <summary>Resolved <see cref="Room"/> for <see cref="RoomText"/> (entity resolution).</summary>
    public Guid? RoomId { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual User? Host { get; set; }
    public virtual Room? Room { get; set; }
}
