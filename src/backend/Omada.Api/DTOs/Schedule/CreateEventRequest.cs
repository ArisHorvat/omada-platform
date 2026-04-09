namespace Omada.Api.DTOs.Schedule;

public class CreateEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    public string? ColorHex { get; set; }
    public Guid EventTypeId { get; set; }
    public Guid? GroupId { get; set; }
    public Guid? RoomId { get; set; }
    public Guid? HostId { get; set; }
    
    public string? RecurrenceRule { get; set; }

    /// <summary>Optional cap on RSVPs per occurrence. Null = unlimited.</summary>
    public int? MaxCapacity { get; set; }

    /// <summary>Include in corporate public feed (events &amp; workshops).</summary>
    public bool IsPublic { get; set; }
}