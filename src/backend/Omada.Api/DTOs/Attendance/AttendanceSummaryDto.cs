using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Attendance;

public class AttendanceSummaryDto
{
    [Required]
    public required int PresentCount { get; set; }

    [Required]
    public required int AbsentCount { get; set; }

    [Required]
    public required int TentativeCount { get; set; }

    [Required]
    public required int TotalTracked { get; set; }

    /// <summary>0–100 when there is at least one present or absent record.</summary>
    [Required]
    public required decimal RatePercent { get; set; }

    [Required]
    public required int PresentStreakDays { get; set; }
}
