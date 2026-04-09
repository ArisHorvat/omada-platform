namespace Omada.Api.Entities;

public class Event : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    public Guid EventTypeId { get; set; }
    public EventType EventType { get; set; } = null!;
    public string? ColorHex { get; set; }
    public Guid? RoomId { get; set; }
    public Guid? GroupId { get; set; }
    /// <summary>Host (presenter, instructor, PM, etc.) — links to <see cref="User"/>; naming avoids uni-only &quot;teacher&quot;.</summary>
    public Guid? HostId { get; set; }

    public string? RecurrenceRule { get; set; }

    /// <summary>Optional cap for RSVPs / seats for this event (per occurrence). Null = unlimited.</summary>
    public int? MaxCapacity { get; set; }

    /// <summary>Visible on corporate org-wide feed (e.g. All-Hands, workshops).</summary>
    public bool IsPublic { get; set; }

    public virtual User? Host { get; set; }
    public virtual Organization Organization { get; set; } = null!;
    public Room? Room { get; set; } // Navigation Property
    public Group? Group { get; set; }
    
    public virtual ICollection<EventOverride> Overrides { get; set; } = new List<EventOverride>();
    public virtual ICollection<EventAssociation> Associations { get; set; } = new List<EventAssociation>();
    public virtual ICollection<EventAttendance> Attendances { get; set; } = new List<EventAttendance>();
}