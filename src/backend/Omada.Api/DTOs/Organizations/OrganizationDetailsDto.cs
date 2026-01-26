namespace Omada.Api.DTOs.Organizations;

public class OrganizationDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string EmailDomain { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = string.Empty;
    public string SecondaryColor { get; set; } = string.Empty;
    public string TertiaryColor { get; set; } = string.Empty;
    public IEnumerable<string> Roles { get; set; } = new List<string>();
    public IEnumerable<string> Widgets { get; set; } = new List<string>();
    public Dictionary<string, List<string>> RoleWidgetMappings { get; set; } = new();
}
