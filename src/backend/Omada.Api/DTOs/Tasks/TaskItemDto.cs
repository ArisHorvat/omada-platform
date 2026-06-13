using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Tasks;

public class TaskItemDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid OrganizationId { get; set; }

    [Required]
    public required Guid AssigneeId { get; set; }

    [Required]
    public required Guid CreatedByUserId { get; set; }

    [Required]
    public required string Title { get; set; }

    public string? Description { get; set; }

    [Required]
    public required bool IsCompleted { get; set; }

    public DateTime? DueDate { get; set; }

    public TaskPriority? Priority { get; set; }

    public Guid? ProjectId { get; set; }

    /// <summary>Linked org group (typically subject, class, or project) — legacy; prefer <see cref="OfferingId"/>.</summary>
    public Guid? SubjectId { get; set; }

    public Guid? PeriodId { get; set; }

    public Guid? OfferingId { get; set; }

    public Guid? AssignmentBatchId { get; set; }

    public string? GroupName { get; set; }

    public string? OfferingName { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    public Guid? GradeCategoryId { get; set; }

    public string? GradeCategoryName { get; set; }

    /// <summary>Parent category share of final grade.</summary>
    public decimal? CategoryWeight { get; set; }

    /// <summary>Effective share of final grade.</summary>
    public decimal? EffectiveWeight { get; set; }

    public string? ReferenceUrl { get; set; }

    public IReadOnlyList<TaskAttachmentDto> Materials { get; set; } = Array.Empty<TaskAttachmentDto>();

    public string? SubmissionUrl { get; set; }

    public IReadOnlyList<TaskAttachmentDto> SubmissionAttachments { get; set; } = Array.Empty<TaskAttachmentDto>();

    public string? TeacherFeedback { get; set; }

    public int? Grade { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
