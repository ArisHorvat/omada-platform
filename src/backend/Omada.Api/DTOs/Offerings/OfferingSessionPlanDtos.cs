using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

/// <summary>
/// One recurring activity slot in a course offering (lecture, lab, seminar, etc.).
/// </summary>
public class OfferingWeeklySessionDto
{
    public Guid? EventTypeId { get; set; }

    public string? EventTypeName { get; set; }

    /// <summary>Contact hours per occurrence (e.g. 1.5 for a 90-minute lab).</summary>
    [Required]
    public required decimal HoursPerSession { get; set; }

    /// <summary>weekly | biweekly | monthly | as_needed</summary>
    [Required]
    public required string Frequency { get; set; }

    /// <summary>When true, the session is optional (e.g. drop-in seminar).</summary>
    public bool IsOptional { get; set; }

    public int SortOrder { get; set; }

    /// <summary>0 = Sunday … 6 = Saturday (matches <see cref="DayOfWeek"/>).</summary>
    public int? DayOfWeek { get; set; }

    /// <summary>Wall-clock start time for timetable publish (HH:mm, 24h).</summary>
    public string? StartTimeLocal { get; set; }
}
