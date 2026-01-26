namespace Omada.Api.Entities;

public class Organization
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? ShortName { get; private set; }
    public string EmailDomain { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }
    public string PrimaryColor { get; private set; } = string.Empty;
    public string SecondaryColor { get; private set; } = string.Empty;
    public string TertiaryColor { get; private set; } = string.Empty;

    private Organization() { }

    public static Result<Organization> Create(
        string name, string? shortName, string emailDomain, string? logoUrl,
        string primaryColor, string secondaryColor, string tertiaryColor)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result<Organization>.Failure("Organization name cannot be empty.");

        if (string.IsNullOrWhiteSpace(emailDomain))
            return Result<Organization>.Failure("Email domain cannot be empty.");

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = name,
            ShortName = shortName,
            EmailDomain = emailDomain,
            LogoUrl = logoUrl,
            PrimaryColor = primaryColor,
            SecondaryColor = secondaryColor,
            TertiaryColor = tertiaryColor
        };

        return Result<Organization>.Success(organization);
    }

    public void Update(string name, string emailDomain, string primaryColor, string secondaryColor, string tertiaryColor)
    {
        if (!string.IsNullOrWhiteSpace(name))
            Name = name;

        if (!string.IsNullOrWhiteSpace(emailDomain))
            EmailDomain = emailDomain;
        
        if (!string.IsNullOrWhiteSpace(primaryColor))
            PrimaryColor = primaryColor;
        
        if (!string.IsNullOrWhiteSpace(secondaryColor))
            SecondaryColor = secondaryColor;
        
        if (!string.IsNullOrWhiteSpace(tertiaryColor))
            TertiaryColor = tertiaryColor;
    }
}
