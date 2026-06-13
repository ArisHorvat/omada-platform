namespace Omada.Api.DTOs.Tasks;

/// <summary>Student turn-in / undo turn-in — assignee only; requires Tasks View.</summary>
public class SubmitTaskSubmissionRequest
{
    public bool IsCompleted { get; set; }

    public string? SubmissionUrl { get; set; }

    public List<TaskAttachmentDto>? SubmissionAttachments { get; set; }
}
