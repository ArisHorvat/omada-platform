namespace Omada.Api.DTOs.Organizations;

public class UpdateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
    public string EmailDomain { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = string.Empty;
    public string SecondaryColor { get; set; } = string.Empty;
    public string TertiaryColor { get; set; } = string.Empty;
    
    public List<string> Roles { get; set; } = new();
    public List<string> Widgets { get; set; } = new();
}