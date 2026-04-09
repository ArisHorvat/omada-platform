using Omada.Api.Entities;

namespace Omada.Api.DTOs.Tasks;

public class UpdateTaskRequest
{
    public string Title { get; set; } = "";

    public string? Description { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? DueDate { get; set; }

    public Guid? AssigneeId { get; set; }

    public TaskPriority? Priority { get; set; }

    public Guid? ProjectId { get; set; }

    public Guid? SubjectId { get; set; }

    public int? MaxScore { get; set; }

    public decimal? Weight { get; set; }

    public string? ReferenceUrl { get; set; }

    public string? SubmissionUrl { get; set; }

    public string? TeacherFeedback { get; set; }

    public int? Grade { get; set; }
}
