using Omada.Api.Entities;
using System.Data;

namespace Omada.Api.Repositories.Interfaces;

public interface IRoleRepository
{
    Task AddRangeAsync(IEnumerable<Role> roles, IDbTransaction transaction);
    Task<IEnumerable<Role>> GetByOrganizationIdAsync(Guid organizationId);
    Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction);
    Task SaveRoleWidgetAccessAsync(Guid roleId, string widgetKey, string accessLevel, IDbTransaction transaction);
    Task<IEnumerable<(string RoleName, string WidgetKey, string AccessLevel)>> GetRoleWidgetAccessAsync(Guid organizationId);
}