using Omada.Api.Entities;

namespace Omada.Api.DTOs.Schedule;

public class UpdateAttendanceRequest
{
    public DateTime InstanceDate { get; set; }

    /// <summary>
    /// Added / Expected (enrollment), corporate RSVP (Tentative, Accepted), or Declined.
    /// </summary>
    public AttendanceStatus Status { get; set; }

    /// <summary>
    /// Optional swap (e.g. university): decline this class instance before applying <see cref="Status"/> on the target event.
    /// Must be used with <see cref="DeclineInstanceDate"/>.
    /// </summary>
    public Guid? DeclineEventId { get; set; }

    /// <summary>Start time of the instance to decline on <see cref="DeclineEventId"/>.</summary>
    public DateTime? DeclineInstanceDate { get; set; }
}