using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Grades;

public class GradeDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string CourseName { get; set; }

    [Required]
    public required decimal Score { get; set; }

    [Required]
    public required decimal Credits { get; set; }

    public string? LetterGrade { get; set; }

    [Required]
    public required string Semester { get; set; }

    /// <summary>Grade points on a 4.0 scale for this row (for display / auditing).</summary>
    [Required]
    public required decimal GradePoints { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }
}
