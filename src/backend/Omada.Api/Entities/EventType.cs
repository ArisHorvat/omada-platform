namespace Omada.Api.Entities;

public class EventType : BaseEntity, IOrganizationScoped
{
    public string Name { get; set; } = string.Empty; // e.g., "Lab", "Stand-up"
    public string ColorHex { get; set; } = "#3b82f6"; // Default Blue
    
    // Organization Link
    public Guid OrganizationId { get; set; }
    
    // Navigation: Which rooms support this event type?
    public ICollection<Room> SupportedRooms { get; set; } = new List<Room>();
}