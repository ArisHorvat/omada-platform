namespace Omada.Api.Entities;

public class Organization : BaseEntity
{
    public OrganizationType OrganizationType { get; set; } = OrganizationType.Corporate;

    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string EmailDomain { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#3b82f6";
    public string SecondaryColor { get; set; } = "#64748b";
    public string TertiaryColor { get; set; } = "#eab308";
    public int OnboardingStep { get; set; } = 0;

    /// <summary>JSON array of completed onboarding checklist step ids (non-cumulative).</summary>
    public string? OnboardingCompletedStepsJson { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Short code members use to join the organization (self-service registration).</summary>
    public string InviteCode { get; set; } = string.Empty;

    /// <summary>Public timetable HTML page for web spider (org admin).</summary>
    public string? SpiderSchedulePageUrl { get; set; }

    /// <summary>News site or section root for discovery crawl (org admin).</summary>
    public string? SpiderNewsStartUrl { get; set; }

    /// <summary>
    /// JSON array of enabled widget keys for this organization. When null, all configurable widgets are enabled.
    /// </summary>
    public string? EnabledWidgetKeysJson { get; set; }

    /// <summary>JSON array of scraped schedule professor labels mapped to org members (import reuse).</summary>
    public string? ScrapedHostAliasesJson { get; set; }

    // EF Core Navigation Properties
    public virtual ICollection<OrganizationMember> Members { get; set; } = new List<OrganizationMember>();
    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
    public virtual ICollection<Group> Groups { get; set; } = new List<Group>();
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
}