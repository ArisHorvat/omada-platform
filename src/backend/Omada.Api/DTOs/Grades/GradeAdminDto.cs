using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Grades;

public class GradeAdminDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid UserId { get; set; }

    public string? StudentName { get; set; }

    public Guid? GroupId { get; set; }

    public string? GroupName { get; set; }

    [Required]
    public required string CourseName { get; set; }

    [Required]
    public required decimal Score { get; set; }

    [Required]
    public required decimal Credits { get; set; }

    public string? LetterGrade { get; set; }

    [Required]
    public required string Semester { get; set; }

    [Required]
    public required decimal GradePoints { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }
}
