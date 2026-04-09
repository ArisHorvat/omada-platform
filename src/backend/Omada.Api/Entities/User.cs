namespace Omada.Api.Entities;

public class User : BaseEntity
{
    /// <summary>Optional job title / role label shown in the directory.</summary>
    public string? Title { get; set; }

    /// <summary>
    /// Optional department/group reference (typically a "Department" group).
    /// This is separate from organization membership and used only for directory filters.
    /// </summary>
    public Guid? DepartmentId { get; set; }

    /// <summary>
    /// Org chart relationship: direct manager/advisor within the same tenant universe.
    /// This is a nullable self-referencing FK for the org chart.
    /// </summary>
    public Guid? ManagerId { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpires { get; set; }
    public string? PhoneNumber { get; set; }
    /// <summary>Relative path to avatar image (e.g. /images/avatars/{id}.jpg). Never store absolute URLs.</summary>
    public string? AvatarUrl { get; set; }
    public string? CNP { get; set; }
    public string? Address { get; set; }
    public bool IsTwoFactorEnabled { get; set; } = false;

    /// <summary>UI theme: "light", "dark", or "system".</summary>
    public string ThemePreference { get; set; } = "system";

    /// <summary>BCP 47 language tag, e.g. "en", "ro".</summary>
    public string LanguagePreference { get; set; } = "en";

    /// <summary>When true, phone/email may appear in organization directory listings.</summary>
    public bool IsPublicInDirectory { get; set; } = true;

    public string? Bio { get; set; }

    /// <summary>JSON object for notification/UI toggles (e.g. newsAlerts, chatMessages).</summary>
    public string? PreferencesJson { get; set; }

    // EF Core Navigation Properties (Org Chart)
    public virtual User? Manager { get; set; }
    public virtual ICollection<User> DirectReports { get; set; } = new List<User>();

    // EF Core Navigation Properties
    public virtual ICollection<OrganizationMember> OrganizationMemberships { get; set; } = new List<OrganizationMember>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}