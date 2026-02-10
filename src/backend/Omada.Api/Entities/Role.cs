namespace Omada.Api.Entities;

public class Role
{
    public Guid Id;
    public Guid OrganizationId;
    public string Name = string.Empty;

    public Role() { }

    public static Role Create(Guid organizationId, string name)
    {
        return new Role { 
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = name
        };
    }
}
