using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Attendance;

public class MyAttendanceResponse
{
    [Required]
    public required AttendanceSummaryDto Summary { get; set; }

    [Required]
    public required IReadOnlyList<AttendanceRecordDto> Records { get; set; }

    /// <summary>Student, SessionManager, Approval, or UniversalSessionManager (from groups attendance-config).</summary>
    [Required]
    public required string Mode { get; set; }

    /// <summary>University or Corporate — drives copy and status labels.</summary>
    [Required]
    public required string OrganizationKind { get; set; }

    public AttendanceSessionDto? NextSession { get; set; }

    /// <summary>Sessions the current user can monitor (class manager / host).</summary>
    [Required]
    public required IReadOnlyList<AttendanceSessionDto> TeacherSessions { get; set; }
}
