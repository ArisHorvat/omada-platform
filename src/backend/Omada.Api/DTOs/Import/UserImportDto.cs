namespace Omada.Api.DTOs.Import;

public class UserImportDto 
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string CNP { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public bool IsGroupManager { get; set; }
}