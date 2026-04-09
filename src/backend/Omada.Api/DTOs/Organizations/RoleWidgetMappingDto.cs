namespace Omada.Api.DTOs.Organizations;

public class RoleWidgetMappingDto
{
    public string RoleName { get; set; } = string.Empty;
    
    // CHANGED: From WidgetId to WidgetKey to match our DB and logic
    public string WidgetKey { get; set; } = string.Empty; 
    
    public string AccessLevel { get; set; } = "view";
}