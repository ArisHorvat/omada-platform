namespace Omada.Api.Entities;

public class EventOverride : BaseEntity
{
    public Guid EventId { get; set; }
    
    // The date of the specific class they want to change or cancel
    public DateTime OriginalStartTime { get; set; } 
    
    public bool IsCancelled { get; set; } // "Sick Leave" override
    
    public DateTime? NewStartTime { get; set; }
    public DateTime? NewEndTime { get; set; }

    public virtual Event Event { get; set; } = null!;
}