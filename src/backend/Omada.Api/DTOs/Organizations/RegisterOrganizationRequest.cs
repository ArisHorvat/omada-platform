using Omada.Api.DTOs.Import;

namespace Omada.Api.DTOs.Organizations;

public class RegisterOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
    public string OrganizationType { get; set; } = "corporate"; // 'university' or 'corporate'
    public string ShortName { get; set; } = string.Empty;
    public string EmailDomain { get; set; } = string.Empty;
    
    // Admin Details
    public string AdminFirstName { get; set; } = string.Empty;
    public string AdminLastName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    
    // Config
    public string DefaultUserPassword { get; set; } = "Welcome123!";
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#3b82f6";
    public string SecondaryColor { get; set; } = "#64748b";
    public string TertiaryColor { get; set; } = "#eab308";
    
    // Arrays from the UI
    public List<string> Roles { get; set; } = new();
    public List<string> Widgets { get; set; } = new();
    public List<RoleWidgetMappingDto> RoleWidgetMappings { get; set; } = new();
    public List<UserImportDto> Users { get; set; } = new();
}