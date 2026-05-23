using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Attendance;

public class AttendanceRecordDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid EventId { get; set; }

    [Required]
    public required string EventTitle { get; set; }

    public Guid? GroupId { get; set; }

    public string? GroupName { get; set; }

    public string? RoomName { get; set; }

    [Required]
    public required DateTime InstanceDate { get; set; }

    [Required]
    public required AttendanceStatus Status { get; set; }

    [Required]
    public required string StatusLabel { get; set; }
}
