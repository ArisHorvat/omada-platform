using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IGroupRepository
{
    Task CreateAsync(Group group);
    Task AddMemberAsync(Guid groupId, Guid userId, string? roleInGroup);
    Task<IEnumerable<Group>> GetGroupsForUserAsync(Guid userId);
    Task<Group?> GetByIdAsync(Guid groupId);
}
