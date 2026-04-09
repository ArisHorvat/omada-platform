namespace Omada.Api.DTOs.Schedule;

public class GetScheduleRequest
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    
    // 🚀 UPDATED: Specific Filters instead of generic "TargetId"
    public Guid? HostId { get; set; }   // Filter by host (instructor, PM, etc.)
    public Guid? GroupId { get; set; }  // Filter by Class/Group
    public Guid? RoomId { get; set; }   // Filter by Room
    public Guid? EventTypeId { get; set; } // Filter by Type (e.g. "Only Labs")

    public bool MyScheduleOnly { get; set; } = true;

    /// <summary>Only events with <see cref="Entities.Event.IsPublic"/> (corporate feed).</summary>
    public bool PublicOnly { get; set; }
}