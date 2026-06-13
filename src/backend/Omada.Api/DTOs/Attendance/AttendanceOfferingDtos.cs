using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Attendance;

public class AttendanceSessionRosterDto
{
    [Required]
    public required Guid EventId { get; set; }

    [Required]
    public required string Title { get; set; }

    public Guid? OfferingId { get; set; }

    public string? OfferingName { get; set; }

    public string? EventTypeName { get; set; }

    [Required]
    public required DateTime InstanceDate { get; set; }

    [Required]
    public required DateTime StartTime { get; set; }

    [Required]
    public required DateTime EndTime { get; set; }

    [Required]
    public required IReadOnlyList<AttendanceRosterMemberDto> Members { get; set; }
}

public class AttendanceRosterMemberDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string DisplayName { get; set; }

    public string? CohortGroupName { get; set; }

    [Required]
    public required AttendanceStatus Status { get; set; }

    [Required]
    public required string StatusLabel { get; set; }
}

public class BulkMarkAttendanceRequest
{
    [Required]
    public required DateTime InstanceDate { get; set; }

    [Required]
    public required IReadOnlyList<BulkMarkAttendanceRowDto> Rows { get; set; }
}

public class BulkMarkAttendanceRowDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required AttendanceStatus Status { get; set; }
}

public class MyOfferingAttendanceResponse
{
    public Guid? PeriodId { get; set; }

    [Required]
    public required IReadOnlyList<OfferingAttendanceSummaryDto> Offerings { get; set; }
}

public class OfferingAttendanceSummaryDto
{
    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required string OfferingName { get; set; }

    public string? OfferingCode { get; set; }

    public decimal? RequiredAttendancePercent { get; set; }

    [Required]
    public required int PresentCount { get; set; }

    [Required]
    public required int HeldCount { get; set; }

    [Required]
    public required decimal RatePercent { get; set; }

    public bool? MeetsRequirement { get; set; }

    [Required]
    public required IReadOnlyList<OfferingActivityAttendanceDto> Activities { get; set; }
}

public class OfferingActivityAttendanceDto
{
    [Required]
    public required Guid EventTypeId { get; set; }

    [Required]
    public required string EventTypeName { get; set; }

    [Required]
    public required int PresentCount { get; set; }

    [Required]
    public required int HeldCount { get; set; }

    [Required]
    public required decimal RatePercent { get; set; }
}

public class WorkTimeEntryDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required DateTime WorkDate { get; set; }

    public DateTime? ClockInUtc { get; set; }

    public DateTime? ClockOutUtc { get; set; }

    [Required]
    public required int BreakMinutes { get; set; }

    [Required]
    public required int WorkedMinutes { get; set; }
}

public class WorkTimeTodayResponse
{
    public WorkTimeEntryDto? Today { get; set; }

    [Required]
    public required IReadOnlyList<WorkTimeEntryDto> Recent { get; set; }
}

public class SetWorkBreakRequest
{
    [Required]
    [Range(0, 24 * 60)]
    public required int BreakMinutes { get; set; }
}
