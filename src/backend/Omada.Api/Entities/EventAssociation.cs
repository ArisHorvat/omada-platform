namespace Omada.Api.Entities;

public class EventAssociation : BaseEntity
{
    public Guid EventId { get; set; }
    
    // The ID of the Room, Group, or User this event belongs to
    public Guid EntityId { get; set; }
    
    // An enum to identify what the EntityId represents
    public EntityType EntityType { get; set; }

    public virtual Event Event { get; set; } = null!;
}