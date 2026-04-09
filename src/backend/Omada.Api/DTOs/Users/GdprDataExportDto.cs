namespace Omada.Api.DTOs.Users;

/// <summary>Shape of the GDPR JSON export (no secrets).</summary>
public class GdprDataExportDto
{
    public DateTime ExportedAtUtc { get; set; }
    public UserProfileExportSection Profile { get; set; } = null!;
    public IReadOnlyList<OrganizationMembershipExportSection> OrganizationMemberships { get; set; } = [];
    public IReadOnlyList<TaskExportSection> Tasks { get; set; } = [];
    public IReadOnlyList<MessageExportSection> Messages { get; set; } = [];
}

public class UserProfileExportSection
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string ThemePreference { get; set; } = string.Empty;
    public string LanguagePreference { get; set; } = string.Empty;
    public bool IsPublicInDirectory { get; set; }
    public bool IsTwoFactorEnabled { get; set; }
    public Dictionary<string, bool> Preferences { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class OrganizationMembershipExportSection
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public bool IsActive { get; set; }
}

public class TaskExportSection
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MessageExportSection
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string DisplayNameSnapshot { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
