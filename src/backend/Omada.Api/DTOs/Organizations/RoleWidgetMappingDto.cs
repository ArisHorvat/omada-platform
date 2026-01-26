namespace Omada.Api.DTOs.Organizations;

public class RoleWidgetMappingDto 
{
    public string RoleName { get; set; } = string.Empty;
    public List<string> Widgets { get; set; } = new();
}
