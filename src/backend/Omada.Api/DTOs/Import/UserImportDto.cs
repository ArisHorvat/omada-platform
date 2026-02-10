namespace Omada.Api.DTOs.Import;

public class UserImportDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Employee";
    public string? PhoneNumber { get; set; }
    public string? CNP { get; set; }
    public string? Address { get; set; }
    public string? Group { get; set; }
    public bool IsGroupManager { get; set; }
}