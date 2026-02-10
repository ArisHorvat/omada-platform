namespace Omada.Api.DTOs.Users;

public class UpdateProfileRequest
{
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? ProfilePictureUrl { get; set; }
}