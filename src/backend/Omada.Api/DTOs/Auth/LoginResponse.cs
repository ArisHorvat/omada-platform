using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Users;

namespace Omada.Api.DTOs.Auth;

public class LoginResponse
{
    [Required]
    public bool RequiresTwoFactor { get; set; }

    public string? TwoFactorSessionToken { get; set; }

    public string? AccessToken { get; set; }

    public string? RefreshToken { get; set; }

    public UserDto? User { get; set; }

    public Guid? OrganizationId { get; set; }

    public string? Role { get; set; }
}
