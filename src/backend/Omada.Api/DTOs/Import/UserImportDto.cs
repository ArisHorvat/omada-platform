using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Import;

public class UserImportDto
{
    [Required]
    public required string FirstName { get; set; }
    
    [Required]
    public required string LastName { get; set; }
    
    [Required]
    public required string Email { get; set; }
    
    [Required]
    public required string Role { get; set; }
    
    // Optionals based on your previous interface
    public string? PhoneNumber { get; set; }
    public string? CNP { get; set; }
    public string? Address { get; set; }
    public string? Group { get; set; }
    public bool? IsGroupManager { get; set; }
}