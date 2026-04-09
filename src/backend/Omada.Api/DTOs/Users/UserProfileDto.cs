using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Users;

public class UserProfileDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string FirstName { get; set; }

    [Required]
    public required string LastName { get; set; }

    [Required]
    public required string Email { get; set; }

    /// <summary>Same value as <see cref="PhoneNumber"/>; aligns with client "Phone" field.</summary>
    public string? Phone { get; set; }

    public string? PhoneNumber { get; set; }

    /// <summary>Relative path; clients resolve against API/static base.</summary>
    public string? AvatarUrl { get; set; }

    public string? Address { get; set; }
    public string? Bio { get; set; }

    /// <summary>Optional job title label shown in directory cards.</summary>
    public string? Title { get; set; }

    /// <summary>Optional department/group reference used for directory filters.</summary>
    public Guid? DepartmentId { get; set; }

    /// <summary>Optional org chart relationship to the user's manager/advisor.</summary>
    public Guid? ManagerId { get; set; }

    [Required]
    public required string ThemePreference { get; set; }

    [Required]
    public required string LanguagePreference { get; set; }

    public bool IsPublicInDirectory { get; set; }

    /// <summary>Notification and UI toggles (e.g. newsAlerts, chatMessages).</summary>
    [Required]
    public required Dictionary<string, bool> Preferences { get; set; }

    public bool IsTwoFactorEnabled { get; set; }

    // This is ONLY returned when a user asks for their OWN profile
    [Required]
    public required Dictionary<string, string> WidgetAccess { get; set; }
}