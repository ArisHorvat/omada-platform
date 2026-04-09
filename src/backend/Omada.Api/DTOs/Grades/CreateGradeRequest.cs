namespace Omada.Api.DTOs.Grades;

/// <summary>Reserved for admin/teacher ingestion endpoints; validated for API consistency.</summary>
public class CreateGradeRequest
{
    public required Guid UserId { get; set; }

    public required string CourseName { get; set; }

    public required decimal Score { get; set; }

    public required decimal Credits { get; set; }

    public string? LetterGrade { get; set; }

    public required string Semester { get; set; }
}
