namespace Omada.Api.Entities;

/// <summary>
/// A graded course result for a student within an organization (university academic use case).
/// </summary>
public class Grade : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    /// <summary>Student (course member) this grade belongs to.</summary>
    public Guid UserId { get; set; }

    /// <summary>Course or subject display name.</summary>
    public string CourseName { get; set; } = string.Empty;

    /// <summary>Numeric score (e.g. percentage 0–100 or institution-specific points).</summary>
    public decimal Score { get; set; }

    /// <summary>Credit hours for this course (used for weighted GPA).</summary>
    public decimal Credits { get; set; }

    /// <summary>Optional letter grade (e.g. A-, B+). Used for GPA when present.</summary>
    public string? LetterGrade { get; set; }

    /// <summary>Term label (e.g. Fall 2025, Spring 2026).</summary>
    public string Semester { get; set; } = string.Empty;

    public virtual User User { get; set; } = null!;

    public virtual Organization Organization { get; set; } = null!;
}
