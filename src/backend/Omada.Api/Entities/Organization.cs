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
    public bool IsActive { get; set; } = true;

    // EF Core Navigation Properties
    public virtual ICollection<OrganizationMember> Members { get; set; } = new List<OrganizationMember>();
    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
    public virtual ICollection<Group> Groups { get; set; } = new List<Group>();
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
}