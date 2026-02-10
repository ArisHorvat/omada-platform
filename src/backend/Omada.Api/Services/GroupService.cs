using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Groups;

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
        if (groupResult.IsFailure) return Result<Group>.Failure(groupResult.Error!);

        try 
        {
            await _groupRepository.CreateAsync(groupResult.Value!);
            
            if (request.ManagerId.HasValue)
            {
                await _groupRepository.AddMemberAsync(groupResult.Value!.Id, request.ManagerId.Value, "Leader");
            }

            return Result<Group>.Success(groupResult.Value!);
        }
        catch (Exception ex)
        {
            return Result<Group>.Failure($"Failed to create group: {ex.Message}");
        }
    }

    public async Task<Result<AttendanceConfigDto>> GetAttendanceConfigAsync(Guid userId, Guid organizationId)
    {
        try
        {
            // 1. Check Universal Admin Rights
            var canManageOrg = await _permissionService.CanManageAllGroupsInOrg(userId, organizationId);
            if (canManageOrg.IsSuccess && canManageOrg.Value)
            {
                return Result<AttendanceConfigDto>.Success(new AttendanceConfigDto { Mode = "UniversalSessionManager" });
            }
            
            var groups = await _groupRepository.GetGroupsForUserAsync(userId);

            // 2. Check Direct Class Management
            var classesManaged = groups.Where(g => g.Type == "class" && g.ManagerId == userId).ToList();
            if (classesManaged.Any())
            {
                return Result<AttendanceConfigDto>.Success(new AttendanceConfigDto 
                { 
                    Mode = "SessionManager", 
                    Groups = classesManaged 
                });
            }

            // 3. Check Department Management
            var deptManaged = groups.FirstOrDefault(g => g.Type == "department" && g.ManagerId == userId);
            if (deptManaged != null)
            {
                return Result<AttendanceConfigDto>.Success(new AttendanceConfigDto 
                { 
                    Mode = "Approval", 
                    Department = deptManaged 
                });
            }

            return Result<AttendanceConfigDto>.Success(new AttendanceConfigDto { Mode = "Student" });
        }
        catch (Exception ex)
        {
            return Result<AttendanceConfigDto>.Failure($"Failed to fetch config: {ex.Message}");
        }
    }
}