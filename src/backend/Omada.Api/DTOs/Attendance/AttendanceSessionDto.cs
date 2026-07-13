using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Attendance;

/// <summary>Upcoming session for check-in or roll call (from schedule).</summary>
public class AttendanceSessionDto
{
    [Required]
    public required Guid EventId { get; set; }

    [Required]
    public required string Title { get; set; }

    public Guid? GroupId { get; set; }

    public string? GroupName { get; set; }

    public string? CohortGroupName { get; set; }

    public string? RoomName { get; set; }

    [Required]
    public required DateTime StartTime { get; set; }

    [Required]
    public required DateTime EndTime { get; set; }

    [Required]
    public required int EnrolledCount { get; set; }

    public int? MaxCapacity { get; set; }

    public Guid? OfferingId { get; set; }

    public string? OfferingName { get; set; }

    public string? EventTypeName { get; set; }

    /// <summary>Occurrence date for roster (start date of this session).</summary>
    public DateTime? InstanceDate { get; set; }
}
