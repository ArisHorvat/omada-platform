namespace Omada.Api.Entities;

public class Message
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // For simplicity in this widget, we assume a single "General" channel per org.
}
