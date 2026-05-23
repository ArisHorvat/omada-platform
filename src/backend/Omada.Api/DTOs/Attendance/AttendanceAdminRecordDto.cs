using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Attendance;

public class AttendanceAdminRecordDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string StudentName { get; set; }

    [Required]
    public required Guid EventId { get; set; }

    [Required]
    public required string EventTitle { get; set; }

    public string? GroupName { get; set; }

    [Required]
    public required DateTime InstanceDate { get; set; }

    [Required]
    public AttendanceStatus Status { get; set; }
}
