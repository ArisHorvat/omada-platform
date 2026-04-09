namespace Omada.Api.Entities;

/// <summary>
/// Marks entities that belong to a single organization. Used for global query filters and documentation.
/// </summary>
public interface IOrganizationScoped
{
    Guid OrganizationId { get; }
}
