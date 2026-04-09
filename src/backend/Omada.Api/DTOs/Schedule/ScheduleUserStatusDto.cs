using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Schedule;

/// <summary>
/// Presence-style schedule summary for a user: <c>Offline</c> (not in org), <c>Busy</c> (in an event now as host), <c>Free</c> (otherwise).
/// </summary>
public class ScheduleUserStatusDto
{
    [Required]
    public required string Status { get; set; }
}
