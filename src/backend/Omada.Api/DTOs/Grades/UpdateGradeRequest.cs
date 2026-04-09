namespace Omada.Api.DTOs.Grades;

public class UpdateGradeRequest
{
    public required string CourseName { get; set; }

    public required decimal Score { get; set; }

    public required decimal Credits { get; set; }

    public string? LetterGrade { get; set; }

    public required string Semester { get; set; }
}
