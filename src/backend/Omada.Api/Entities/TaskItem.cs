namespace Omada.Api.Entities;

public class TaskItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    /// <summary>User responsible for completing the task (delegation).</summary>
    public Guid AssigneeId { get; set; }

    /// <summary>User who created the task (manager/teacher).</summary>
    public Guid CreatedByUserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? DueDate { get; set; }

    // --- Corporate (use when organization is corporate) ---
    public TaskPriority? Priority { get; set; }

    public Guid? ProjectId { get; set; }

    // --- University (use when organization is a university) ---
    public Guid? SubjectId { get; set; }

    public int? MaxScore { get; set; }

    /// <summary>Weight toward grade, e.g. 0.20 for 20%.</summary>
    public decimal? Weight { get; set; }

    // --- Submission & review ---
    public string? ReferenceUrl { get; set; }

    public string? SubmissionUrl { get; set; }

    public string? TeacherFeedback { get; set; }

    public int? Grade { get; set; }

    public virtual User Assignee { get; set; } = null!;

    public virtual User Creator { get; set; } = null!;

    public virtual Organization Organization { get; set; } = null!;
}
