namespace Omada.Api.DTOs.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public Guid OrganizationId { get; set; }
    public string Role { get; set; } = string.Empty;
}