namespace Omada.Api.Entities;

public class Widget
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;

    private Widget() { }

    public static Widget Create(Guid organizationId, string name)
    {
        return new Widget { 
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = name
        };
    }
}
