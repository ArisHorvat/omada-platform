namespace Omada.Api.Abstractions;

/// <summary>
/// Resolves the current organization from the HTTP user (JWT). Returns null when there is no
/// authenticated tenant context (e.g. design-time migrations, startup seeding).
/// </summary>
public interface ITenantAccessor
{
    Guid? CurrentOrganizationId { get; }
}
