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

    public Guid? PeriodId { get; set; }

    /// <summary>Term offering context (each assignee still gets their own row when batch-distributed).</summary>
    public Guid? OfferingId { get; set; }

    /// <summary>Links per-student copies created from one admin "post assignment" action.</summary>
    public Guid? AssignmentBatchId { get; set; }

    public int? MaxScore { get; set; }

    /// <summary>
    /// When <see cref="GradeCategoryId"/> is set: share within that category (0–1).
    /// Otherwise: share of the final course grade (0–1).
    /// </summary>
    public decimal? Weight { get; set; }

    /// <summary>Grade bucket (exam, lab, …) when using structured course grade plans.</summary>
    public Guid? GradeCategoryId { get; set; }

    // --- Submission & review ---
    public string? ReferenceUrl { get; set; }

    /// <summary>JSON array of teacher materials (<see cref="DTOs.Tasks.TaskAttachmentDto"/>).</summary>
    public string? MaterialsJson { get; set; }

    public string? SubmissionUrl { get; set; }

    /// <summary>JSON array of student submission files/links.</summary>
    public string? SubmissionAttachmentsJson { get; set; }

    public string? TeacherFeedback { get; set; }

    public int? Grade { get; set; }

    public virtual User Assignee { get; set; } = null!;

    public virtual User Creator { get; set; } = null!;

    public virtual Organization Organization { get; set; } = null!;

    public virtual OrganizationPeriod? Period { get; set; }

    public virtual CourseOffering? Offering { get; set; }

    public virtual OfferingGradeCategory? GradeCategory { get; set; }
}
