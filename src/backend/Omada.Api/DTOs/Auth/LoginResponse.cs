using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Users;

namespace Omada.Api.DTOs.Auth;

public class LoginResponse
{
    [Required]
    public required string AccessToken { get; set; }
    
    public string? RefreshToken { get; set; } // Optional if not always issued
        
    [Required]
    public required UserDto User { get; set; }
        
    [Required]
    public required Guid OrganizationId { get; set; }
    
    [Required]
    public required string Role { get; set; }
}