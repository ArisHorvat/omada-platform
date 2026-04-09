using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Users;

public class UserDto
{
    [Required]
    public required Guid Id { get; set; }
    
    [Required]
    public required string FirstName { get; set; }

    [Required]
    public required string LastName { get; set; }

    [Required]
    public required string Email { get; set; }
    
    // Optional
    public string? PhoneNumber { get; set; } 
}