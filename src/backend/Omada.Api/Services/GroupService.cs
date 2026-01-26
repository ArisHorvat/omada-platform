using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class GroupService : IGroupService
{
    private readonly IGroupRepository _groupRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPermissionService _permissionService;

    public GroupService(IGroupRepository groupRepository, IUserRepository userRepository, IPermissionService permissionService)
    {
        _groupRepository = groupRepository;
        _userRepository = userRepository;
        _permissionService = permissionService;
    }

    public async Task<Result<Group>> CreateGroupAsync(CreateGroupRequest request)
    {
        var groupResult = Group.Create(request.OrganizationId, request.Name, request.Type, request.ManagerId, request.ParentGroupId, request.ScheduleConfig);
        if (groupResult.IsFailure) return groupResult;

        await _groupRepository.CreateAsync(groupResult.Value!);
        
        if (request.ManagerId.HasValue)
        {
            await _groupRepository.AddMemberAsync(groupResult.Value!.Id, request.ManagerId.Value, "Leader");
        }

        return groupResult;
    }

    public async Task<object> GetAttendanceConfigAsync(Guid userId, Guid organizationId)
    {
        var memberships = await _userRepository.GetMembershipsAsync(userId);
        var currentMembership = memberships.FirstOrDefault(m => m.OrganizationId == organizationId);
        var role = currentMembership?.Role ?? "User";

        var groups = await _groupRepository.GetGroupsForUserAsync(userId);

        if (await _permissionService.CanManageAllGroupsInOrg(userId, organizationId))
        {
            return new { Mode = "UniversalSessionManager" };
        }
        
        var classesManaged = groups.Where(g => g.Type == "class" && g.ManagerId == userId).ToList();
        if (classesManaged.Any())
        {
            return new { Mode = "SessionManager", Groups = classesManaged };
        }

        var deptManaged = groups.FirstOrDefault(g => g.Type == "department" && g.ManagerId == userId);
        if (deptManaged != null)
        {
            return new { Mode = "Approval", Department = deptManaged.Name };
        }

        return new { Mode = "ClockIn" };
    }
}