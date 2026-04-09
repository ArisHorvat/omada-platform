using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Schedule;

public class ScheduleItemDto
{
    // --- Identification ---
    [Required]
    public Guid Id { get; set; }
    
    // 🚀 NEW: Required for the frontend to select the correct type in Edit Mode
    [Required]
    public Guid EventTypeId { get; set; } 

    // --- Content ---
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Subtitle { get; set; } = string.Empty;
    
    // --- Timing ---
    [Required]
    public DateTime StartTime { get; set; }
    
    [Required]
    public DateTime EndTime { get; set; }
    
    public string? RecurrenceRule { get; set; }

    // --- Styling ---
    [Required]
    public string TypeName { get; set; } = "Event"; 
    
    [Required]
    public string Color { get; set; } = "#3b82f6";

    // --- Relationships ---
    public Guid? RoomId { get; set; }
    public string? RoomName { get; set; }

    public Guid? HostId { get; set; }
    public string? HostName { get; set; }

    public Guid? GroupId { get; set; }
    public string? GroupName { get; set; }

    /// <summary>RSVP / seat count for this occurrence (Added, Expected, Accepted, Tentative).</summary>
    public int CurrentRSVPCount { get; set; }

    /// <summary>Capacity cap for this event occurrence; null = unlimited.</summary>
    public int? MaxCapacity { get; set; }

    /// <summary>Listed on the corporate org-wide public feed.</summary>
    public bool IsPublic { get; set; }
}