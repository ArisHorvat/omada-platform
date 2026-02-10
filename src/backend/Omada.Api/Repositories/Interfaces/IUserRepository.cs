using System.Data;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task CreateAsync(User user, IDbTransaction transaction);
    Task<User?> GetByEmailAsync(string email, IDbTransaction? transaction = null);
    Task<User?> GetByIdAsync(Guid id);
    Task UpdateAsync(User user);
    Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction);
    Task AddMemberAsync(Guid organizationId, Guid userId, Guid roleId, IDbTransaction transaction);
    Task<IEnumerable<OrganizationMember>> GetMembershipsAsync(Guid userId);
    Task<IEnumerable<(string WidgetKey, string AccessLevel)>> GetUserWidgetAccessAsync(Guid userId, Guid organizationId);
}
