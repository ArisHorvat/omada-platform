namespace Omada.Api.Entities;

public class Role
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;

    private Role() { }

    public static Role Create(Guid organizationId, string name)
    {
        return new Role { 
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = name
        };
    }
}
