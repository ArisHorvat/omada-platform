using Omada.Api.Entities; // Needed for Result
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

    public async Task<Result<bool>> CanManageGroup(Guid userId, Guid groupId)
    {
        try
        {
            var group = await _groupRepository.GetByIdAsync(groupId);
            if (group == null) return Result<bool>.Failure("Group not found");

            // 1. Direct Manager
            if (group.ManagerId == userId) return Result<bool>.Success(true);

            // 2. Organization Admin / Director
            return await CanManageAllGroupsInOrg(userId, group.OrganizationId);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }

    public async Task<Result<bool>> CanManageAllGroupsInOrg(Guid userId, Guid organizationId)
    {
        try
        {
            var permissions = await _userRepository.GetUserWidgetAccessAsync(userId, organizationId);
            
            var hasAccess = permissions.Any(p => 
                (p.WidgetKey == "users" && (p.AccessLevel == "admin" || p.AccessLevel == "edit")) ||
                (p.WidgetKey == "settings" && p.AccessLevel == "admin")
            );

            return Result<bool>.Success(hasAccess);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}