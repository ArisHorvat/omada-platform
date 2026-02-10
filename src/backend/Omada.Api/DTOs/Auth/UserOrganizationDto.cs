namespace Omada.Api.DTOs.Auth;

public class UserOrganizationDto
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
}