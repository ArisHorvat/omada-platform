namespace Omada.Api.DTOs.Organizations;

public record UpdateOrganizationRequest(
    string Name,
    string EmailDomain,
    string PrimaryColor,
    string SecondaryColor,
    string TertiaryColor,
    List<string> Roles,
    List<string> Widgets);
