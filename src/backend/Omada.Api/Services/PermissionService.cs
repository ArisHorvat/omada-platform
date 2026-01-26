using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class PermissionService : IPermissionService
{
    private readonly IGroupRepository _groupRepository;
    private readonly IUserRepository _userRepository;

    public PermissionService(IGroupRepository groupRepository, IUserRepository userRepository)
    {
        _groupRepository = groupRepository;
        _userRepository = userRepository;
    }

    public async Task<bool> CanManageGroup(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);
        if (group == null) return false;

        // Check if user is the direct manager
        if (group.ManagerId == userId) return true;

        // Check if user has a role with universal management rights
        return await CanManageAllGroupsInOrg(userId, group.OrganizationId);
    }

    public async Task<bool> CanManageAllGroupsInOrg(Guid userId, Guid organizationId)
    {
        var memberships = await _userRepository.GetMembershipsAsync(userId);
        var currentMembership = memberships.FirstOrDefault(m => m.OrganizationId == organizationId);
        if (currentMembership == null) return false;

        // Define roles with universal management scope
        var universalManagerRoles = new List<string> { "Admin", "SuperAdmin", "Registrar", "Dean", "Director", "HR Manager" };

        return universalManagerRoles.Contains(currentMembership.Role, StringComparer.OrdinalIgnoreCase);
    }
}