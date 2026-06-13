using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class GradebookCohortOptionDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }
}

public class GradebookStudentSummaryDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string DisplayName { get; set; }

    public Guid? CohortGroupId { get; set; }

    public string? CohortGroupName { get; set; }

    public decimal? GradeSoFarTen { get; set; }

    [Required]
    public required int GradedCount { get; set; }

    [Required]
    public required int TotalAssignments { get; set; }

    [Required]
    public required int SubmittedCount { get; set; }

    [Required]
    public required int OverdueCount { get; set; }

    [Required]
    public required int PendingCount { get; set; }
}

public class OfferingGradebookDto
{
    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required string OfferingName { get; set; }

    public string? OfferingCode { get; set; }

    [Required]
    public required Guid PeriodId { get; set; }

    [Required]
    public required decimal Credits { get; set; }

    [Required]
    public required List<GradebookCohortOptionDto> CohortOptions { get; set; }

    [Required]
    public required List<GradebookStudentSummaryDto> Students { get; set; }
}

public class GradebookAssignmentRowDto
{
    [Required]
    public required Guid TaskId { get; set; }

    [Required]
    public required string Title { get; set; }

    public Guid? AssignmentBatchId { get; set; }

    public DateTime? DueDate { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    public decimal? EffectiveWeight { get; set; }

    public decimal? Grade { get; set; }

    public decimal? GradeTen { get; set; }

    [Required]
    public required bool IsCompleted { get; set; }

    [Required]
    public required bool IsLate { get; set; }

    public string? TeacherFeedback { get; set; }

    [Required]
    public required string Status { get; set; }
}

public class GradebookCategoryBreakdownDto
{
    [Required]
    public required string Id { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? WeightLabel { get; set; }

    public decimal? CategoryAverageTen { get; set; }

    [Required]
    public required List<GradebookAssignmentRowDto> Assignments { get; set; }
}

public class GradebookStatsDto
{
    [Required]
    public required int Total { get; set; }

    [Required]
    public required int Graded { get; set; }

    [Required]
    public required int Pending { get; set; }

    [Required]
    public required int Submitted { get; set; }

    [Required]
    public required int Overdue { get; set; }
}

public class StudentOfferingGradeBreakdownDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string DisplayName { get; set; }

    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required string CourseName { get; set; }

    public string? CourseCode { get; set; }

    public decimal? GradeSoFarTen { get; set; }

    [Required]
    public required decimal Credits { get; set; }

    [Required]
    public required GradebookStatsDto Stats { get; set; }

    [Required]
    public required List<GradebookCategoryBreakdownDto> Categories { get; set; }
}
