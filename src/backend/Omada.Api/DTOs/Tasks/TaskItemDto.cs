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

    public Guid? SubjectId { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    public string? ReferenceUrl { get; set; }

    public string? SubmissionUrl { get; set; }

    public string? TeacherFeedback { get; set; }

    public int? Grade { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
