using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Tasks;

public class CreateAssignmentBatchRequest
{
    [Required]
    public required string Title { get; set; }

    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }

    [Required]
    public required TaskDistributionScope DistributionScope { get; set; }

    public Guid? OfferingId { get; set; }

    /// <summary>Target group (class, lab, cohort) when <see cref="DistributionScope"/> is <see cref="TaskDistributionScope.GroupMembers"/>.</summary>
    public Guid? SubjectId { get; set; }

    public Guid? GradeCategoryId { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    public string? ReferenceUrl { get; set; }

    public List<TaskAttachmentDto>? Materials { get; set; }
}

public class CreateAssignmentBatchResultDto
{
    [Required]
    public required Guid BatchId { get; set; }

    [Required]
    public required int CreatedCount { get; set; }

    [Required]
    public required int SkippedCount { get; set; }

    public TaskItemDto? SampleTask { get; set; }
}

public class AssignmentBatchSummaryDto
{
    [Required]
    public required Guid BatchId { get; set; }

    [Required]
    public required string Title { get; set; }

    public string? Description { get; set; }

    public TaskDistributionScope DistributionScope { get; set; }

    public Guid? OfferingId { get; set; }

    public string? OfferingName { get; set; }

    public Guid? SubjectId { get; set; }

    public string? GroupName { get; set; }

    public DateTime? DueDate { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    [Required]
    public required int TotalAssigned { get; set; }

    [Required]
    public required int SubmittedCount { get; set; }

    [Required]
    public required int GradedCount { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }
}

public class AssignmentBatchSubmissionDto
{
    [Required]
    public required Guid TaskId { get; set; }

    [Required]
    public required Guid StudentUserId { get; set; }

    [Required]
    public required string StudentName { get; set; }

    [Required]
    public required bool IsCompleted { get; set; }

    public string? SubmissionUrl { get; set; }

    public List<TaskAttachmentDto> SubmissionAttachments { get; set; } = new();

    public decimal? Grade { get; set; }

    public string? TeacherFeedback { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DueDate { get; set; }

    public int? MaxScore { get; set; }

    public Guid? CohortGroupId { get; set; }

    public string? CohortGroupName { get; set; }

    /// <summary>True when the student turned in after the due date.</summary>
    public bool IsLate { get; set; }
}
