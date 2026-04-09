using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Groups;
using Omada.Api.Abstractions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;

namespace Omada.Api.Services;

public class GroupService : IGroupService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IPermissionService _permissionService;
    private readonly ApplicationDbContext _context; // For advanced LINQ queries

    public GroupService(IUnitOfWork uow, IUserContext userContext, IPermissionService permissionService, ApplicationDbContext context)
    {
        _uow = uow;
        _userContext = userContext;
        _permissionService = permissionService;
        _context = context;
    }

    public async Task<ServiceResponse<GroupDto>> CreateGroupAsync(CreateGroupRequest request)
    {
        var organizationId = _userContext.OrganizationId;

        var group = new Group
        {
            OrganizationId = organizationId,
            Name = request.Name,
            Type = request.Type,
            ManagerId = request.ManagerId,
            ParentGroupId = request.ParentGroupId,
            ScheduleConfig = request.ScheduleConfig
        };

        await _uow.Repository<Group>().AddAsync(group);
        
        if (request.ManagerId.HasValue)
        {
            var groupMember = new GroupMember 
            { 
                GroupId = group.Id, 
                UserId = request.ManagerId.Value, 
                RoleInGroup = "Leader" 
            };
            await _uow.Repository<GroupMember>().AddAsync(groupMember);
        }

        await _uow.CompleteAsync(); // Saves everything atomically

        var groupDto = new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Type = group.Type,
            ParentGroupId = group.ParentGroupId
        };

        return new ServiceResponse<GroupDto>(true, groupDto);
    }

    public async Task<ServiceResponse<AttendanceConfigDto>> GetAttendanceConfigAsync()
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var canManageOrgResponse = await _permissionService.CanManageAllGroupsInOrg(userId, organizationId);
        if (canManageOrgResponse.IsSuccess && canManageOrgResponse.Data)
        {
            return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
            {
                Mode = "UniversalSessionManager",
                Groups = new List<GroupDto>() // REQUIRED: Initialize empty list
            });
        }

        // Get all groups where user is a member
        var groups = await _context.GroupMembers
            .Where(gm => gm.UserId == userId && gm.Group.OrganizationId == organizationId)
            .Select(gm => gm.Group)
            .ToListAsync();

        var classesManaged = groups.Where(g => g.Type == "class" && g.ManagerId == userId).ToList();
        if (classesManaged.Any())
        {
            return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
            {
                Mode = "SessionManager",
                // FIX: Map Entities to DTOs
                Groups = classesManaged.Select(g => new GroupDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    Type = g.Type,
                    ParentGroupId = g.ParentGroupId
                }).ToList()
            });
        }

        var deptManaged = groups.FirstOrDefault(g => g.Type == "department" && g.ManagerId == userId);
        if (deptManaged != null)
        {
            return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
            {
                Mode = "Approval",
                Groups = new List<GroupDto>(), // REQUIRED: Initialize empty list
                                               // FIX: Map the single Entity to a DTO
                Department = new GroupDto
                {
                    Id = deptManaged.Id,
                    Name = deptManaged.Name,
                    Type = deptManaged.Type,
                    ParentGroupId = deptManaged.ParentGroupId
                }
            });
        }

        return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
        {
            Mode = "Student",
            Groups = new List<GroupDto>() // REQUIRED: Initialize empty list
        });
    }

    public async Task<ServiceResponse<IEnumerable<DepartmentSummaryDto>>> GetDepartmentsAsync()
    {
        var organizationId = _userContext.OrganizationId;

        var departments = await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted && g.Type.ToLower() == "department")
            .OrderBy(g => g.Name)
            .Select(g => new DepartmentSummaryDto { Id = g.Id, Name = g.Name })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<DepartmentSummaryDto>>(true, departments);
    }
}