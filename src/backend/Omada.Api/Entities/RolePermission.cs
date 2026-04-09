namespace Omada.Api.Entities;

// Note: Composite Key (RoleId + WidgetKey)
public class RolePermission
{
    public Guid RoleId { get; set; }
    public string WidgetKey { get; set; } = string.Empty;
    
    // Memory Optimized: Uses the TINYINT Enum
    public AccessLevel AccessLevel { get; set; } 

    public virtual Role Role { get; set; } = null!;
}