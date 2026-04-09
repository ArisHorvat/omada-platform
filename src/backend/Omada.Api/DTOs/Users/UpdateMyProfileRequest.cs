namespace Omada.Api.DTOs.Users;

/// <summary>
/// Partial update for <c>PUT /api/users/me</c>. Null properties are left unchanged.
/// </summary>
public class UpdateMyProfileRequest
{
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? ThemePreference { get; set; }
    public string? LanguagePreference { get; set; }
    public bool? IsPublicInDirectory { get; set; }

    /// <summary>Replaces stored preference toggles when provided (e.g. newsAlerts, chatMessages).</summary>
    public Dictionary<string, bool>? Preferences { get; set; }
}
