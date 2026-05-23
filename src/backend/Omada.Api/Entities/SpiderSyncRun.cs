namespace Omada.Api.Entities;

public class SpiderSyncRun : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public SpiderSyncKind Kind { get; set; }
    public SpiderSyncStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int ItemsProcessed { get; set; }
    public int ItemsCreated { get; set; }
    public int ItemsUpdated { get; set; }
    public int ItemsRemoved { get; set; }
    public int ItemsSkipped { get; set; }
    public Guid? InitiatedByUserId { get; set; }
    public string? HangfireJobId { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
