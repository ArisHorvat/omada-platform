using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Attendance;

/// <summary>
/// Staff records attendance for another member (e.g. after scanning Digital ID).
/// </summary>
public class RecordMemberAttendanceRequest
{
    [Required]
    public required Guid EventId { get; set; }

    [Required]
    public required DateTime InstanceDate { get; set; }

    [Required]
    public required Guid UserId { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Added;
}
