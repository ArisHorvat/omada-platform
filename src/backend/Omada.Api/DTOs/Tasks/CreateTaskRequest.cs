using Omada.Api.Entities;

namespace Omada.Api.DTOs.Tasks;

public class CreateTaskRequest
{
    public string Title { get; set; } = "";

    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }

    /// <summary>When null, the current user is the assignee.</summary>
    public Guid? AssigneeId { get; set; }

    public TaskPriority? Priority { get; set; }

    public Guid? ProjectId { get; set; }

    public Guid? SubjectId { get; set; }

    public Guid? OfferingId { get; set; }

    public Guid? GradeCategoryId { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    public string? ReferenceUrl { get; set; }

    public List<TaskAttachmentDto>? Materials { get; set; }

    public string? SubmissionUrl { get; set; }

    public List<TaskAttachmentDto>? SubmissionAttachments { get; set; }
}
