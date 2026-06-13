namespace Omada.Api.DTOs.Auth;

public class JoinOrganizationRequest
{
    public string InviteCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    /// <summary>Optional setup token from the invite email link.</summary>
    public string? SetupToken { get; set; }
}
