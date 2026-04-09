namespace Omada.Api.DTOs.Users;

public class UpdateProfileRequest
{
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    /// <summary>Relative path (e.g. /images/avatars/…); never an absolute URL.</summary>
    public string? AvatarUrl { get; set; }
}