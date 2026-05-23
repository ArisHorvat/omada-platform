using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Groups;
using Omada.Api.DTOs.Common;
using Omada.Api.Abstractions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Services;

public class GroupService : IGroupService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IPermissionService _permissionService;
    private readonly ApplicationDbContext _context;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public GroupService(
        IUnitOfWork uow,
        IUserContext userContext,
        IPermissionService permissionService,
        ApplicationDbContext context,
        IPublicMediaUrlResolver mediaUrls)
    {
        _uow = uow;
        _userContext = userContext;
        _permissionService = permissionService;
        _context = context;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<GroupDto>> CreateGroupAsync(CreateGroupRequest request)
    {
        var organizationId = _userContext.OrganizationId;
        var normalizedType = GroupTypes.Normalize(request.Type);

        var parentError = await ValidateParentAsync(organizationId, null, request.ParentGroupId);
        if (parentError != null)
            return new ServiceResponse<GroupDto>(false, null, parentError);

        var group = new Group
        {
            OrganizationId = organizationId,
            Name = request.Name.Trim(),
            Type = normalizedType,
            ManagerId = request.ManagerId,
            ParentGroupId = request.ParentGroupId,
            ScheduleConfig = request.ScheduleConfig
        };

        await _uow.Repository<Group>().AddAsync(group);

        if (request.ManagerId.HasValue)
            await EnsureManagerMembershipAsync(group.Id, request.ManagerId.Value);

        await _uow.CompleteAsync();

        return new ServiceResponse<GroupDto>(true, await MapGroupDtoAsync(group.Id));
    }

    public async Task<ServiceResponse<GroupDto>> UpdateGroupAsync(Guid id, UpdateGroupRequest request)
    {
        var organizationId = _userContext.OrganizationId;
        var group = await _uow.Repository<Group>().GetByIdAsync(id);
        if (group == null || group.OrganizationId != organizationId)
            return new ServiceResponse<GroupDto>(false, null, new AppError(ErrorCodes.NotFound, "Group not found."));

        var parentError = await ValidateParentAsync(organizationId, id, request.ParentGroupId);
        if (parentError != null)
            return new ServiceResponse<GroupDto>(false, null, parentError);

        var previousManagerId = group.ManagerId;
        group.Name = request.Name.Trim();
        group.Type = GroupTypes.Normalize(request.Type);
        group.ManagerId = request.ManagerId;
        group.ParentGroupId = request.ParentGroupId;
        group.ScheduleConfig = request.ScheduleConfig;
        group.UpdatedAt = DateTime.UtcNow;

        _uow.Repository<Group>().Update(group);

        if (request.ManagerId.HasValue && request.ManagerId != previousManagerId)
            await EnsureManagerMembershipAsync(group.Id, request.ManagerId.Value);

        await _uow.CompleteAsync();
        return new ServiceResponse<GroupDto>(true, await MapGroupDtoAsync(group.Id));
    }

    public async Task<ServiceResponse<bool>> DeleteGroupAsync(Guid id)
    {
        var organizationId = _userContext.OrganizationId;
        var group = await _uow.Repository<Group>().GetByIdAsync(id);
        if (group == null || group.OrganizationId != organizationId)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Group not found."));

        await SoftDeleteGroupRecursiveAsync(id);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<GroupDetailDto>> GetGroupByIdAsync(Guid id)
    {
        var organizationId = _userContext.OrganizationId;

        var group = await _context.Groups
            .AsNoTracking()
            .Where(g => g.Id == id && g.OrganizationId == organizationId && !g.IsDeleted)
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.Type,
                g.ParentGroupId,
                ParentName = g.ParentGroup != null ? g.ParentGroup.Name : null,
                g.ManagerId,
                ManagerFirst = g.Manager != null ? g.Manager.FirstName : null,
                ManagerLast = g.Manager != null ? g.Manager.LastName : null,
                g.ScheduleConfig,
                MemberCount = g.Members.Count,
                ChildCount = g.SubGroups.Count(sg => !sg.IsDeleted),
            })
            .FirstOrDefaultAsync();

        if (group == null)
            return new ServiceResponse<GroupDetailDto>(false, null, new AppError(ErrorCodes.NotFound, "Group not found."));

        var children = await _context.Groups
            .AsNoTracking()
            .Where(g => g.ParentGroupId == id && g.OrganizationId == organizationId && !g.IsDeleted)
            .OrderBy(g => g.Name)
            .Select(g => new GroupSummaryDto
            {
                Id = g.Id,
                Name = g.Name,
                Type = g.Type,
                MemberCount = g.Members.Count
            })
            .ToListAsync();

        var detail = new GroupDetailDto
        {
            Id = group.Id,
            Name = group.Name,
            Type = group.Type,
            ParentGroupId = group.ParentGroupId,
            ParentName = group.ParentName,
            ManagerId = group.ManagerId,
            ManagerName = group.ManagerFirst != null
                ? $"{group.ManagerFirst} {group.ManagerLast}".Trim()
                : null,
            ScheduleConfig = group.ScheduleConfig,
            MemberCount = group.MemberCount,
            ChildCount = group.ChildCount,
            Children = children
        };

        return new ServiceResponse<GroupDetailDto>(true, detail);
    }

    public async Task<ServiceResponse<IEnumerable<GroupTreeNodeDto>>> GetGroupTreeAsync()
    {
        var organizationId = _userContext.OrganizationId;

        var rows = await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted)
            .OrderBy(g => g.Name)
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.Type,
                g.ParentGroupId,
                MemberCount = g.Members.Count
            })
            .ToListAsync();

        var lookup = rows.ToDictionary(
            r => r.Id,
            r => new GroupTreeNodeDto
            {
                Id = r.Id,
                Name = r.Name,
                Type = r.Type,
                ParentGroupId = r.ParentGroupId,
                MemberCount = r.MemberCount,
                Children = new List<GroupTreeNodeDto>()
            });

        var roots = new List<GroupTreeNodeDto>();
        foreach (var row in rows)
        {
            var node = lookup[row.Id];
            if (row.ParentGroupId.HasValue && lookup.TryGetValue(row.ParentGroupId.Value, out var parent))
                ((List<GroupTreeNodeDto>)parent.Children).Add(node);
            else
                roots.Add(node);
        }

        SortTree(roots);
        return new ServiceResponse<IEnumerable<GroupTreeNodeDto>>(true, roots);
    }

    public async Task<ServiceResponse<IEnumerable<GroupPickerItemDto>>> GetAssignableGroupsAsync(string context)
    {
        var organizationId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        var allowedTypes = GetAssignableTypesForContext(context);

        var orgType = await _context.Organizations
            .AsNoTracking()
            .Where(o => o.Id == organizationId)
            .Select(o => o.OrganizationType)
            .FirstOrDefaultAsync();

        var typeCatalog = GroupTypes.GetCatalog(orgType)
            .ToDictionary(t => t.Key, t => t.Label, StringComparer.OrdinalIgnoreCase);

        var canManageAll = (await _permissionService.CanManageAllGroupsInOrg(userId, organizationId)).Data;

        var memberGroupIds = await _context.GroupMembers
            .AsNoTracking()
            .Where(gm => gm.UserId == userId && gm.Group.OrganizationId == organizationId && !gm.Group.IsDeleted)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        var query = _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted);

        if (!canManageAll)
        {
            query = query.Where(g =>
                memberGroupIds.Contains(g.Id) ||
                g.ManagerId == userId);
        }

        var rows = await query
            .OrderBy(g => g.Name)
            .Select(g => new { g.Id, g.Name, g.Type })
            .ToListAsync();

        var items = rows
            .Where(r => allowedTypes.Contains(GroupTypes.Normalize(r.Type)))
            .Select(r => new GroupPickerItemDto
            {
                Id = r.Id,
                Name = r.Name,
                Type = GroupTypes.Normalize(r.Type),
                TypeLabel = typeCatalog.TryGetValue(GroupTypes.Normalize(r.Type), out var label)
                    ? label
                    : r.Type
            })
            .ToList();

        return new ServiceResponse<IEnumerable<GroupPickerItemDto>>(true, items);
    }

    private static HashSet<string> GetAssignableTypesForContext(string context)
    {
        var key = string.IsNullOrWhiteSpace(context) ? "schedule" : context.Trim().ToLowerInvariant();
        return key switch
        {
            "assignment" or "assignments" or "tasks" => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Subject, GroupTypes.Class, GroupTypes.Series, GroupTypes.Program,
                GroupTypes.Team, GroupTypes.Project
            },
            "grade" or "grades" => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Subject, GroupTypes.Class, GroupTypes.Program,
                GroupTypes.Department, GroupTypes.Faculty, GroupTypes.Division
            },
            "attendance" => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Subject, GroupTypes.Class, GroupTypes.Series, GroupTypes.Subgroup,
                GroupTypes.Team, GroupTypes.Squad, GroupTypes.Project,
                GroupTypes.Department, GroupTypes.Division, GroupTypes.Faculty
            },
            _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Subject, GroupTypes.Class, GroupTypes.Series, GroupTypes.Subgroup,
                GroupTypes.Team, GroupTypes.Squad, GroupTypes.Project
            }
        };
    }

    public async Task<ServiceResponse<IEnumerable<GroupTypeOptionDto>>> GetGroupTypeCatalogAsync()
    {
        var organizationId = _userContext.OrganizationId;
        var orgType = await _context.Organizations
            .AsNoTracking()
            .Where(o => o.Id == organizationId)
            .Select(o => o.OrganizationType)
            .FirstOrDefaultAsync();

        var catalog = GroupTypes.GetCatalog(orgType)
            .Select(o => new GroupTypeOptionDto
            {
                Key = o.Key,
                Label = o.Label,
                Description = o.Description,
                SuggestedParentType = o.SuggestedParentType
            })
            .ToList();

        return new ServiceResponse<IEnumerable<GroupTypeOptionDto>>(true, catalog);
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
                Groups = new List<GroupDto>()
            });
        }

        var groups = await _context.GroupMembers
            .Where(gm => gm.UserId == userId && gm.Group.OrganizationId == organizationId && !gm.Group.IsDeleted)
            .Select(gm => gm.Group)
            .ToListAsync();

        var classesManaged = groups
            .Where(g => string.Equals(g.Type, GroupTypes.Class, StringComparison.OrdinalIgnoreCase) && g.ManagerId == userId)
            .ToList();
        if (classesManaged.Count > 0)
        {
            var dtos = new List<GroupDto>();
            foreach (var g in classesManaged)
                dtos.Add(await MapGroupDtoAsync(g.Id));

            return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
            {
                Mode = "SessionManager",
                Groups = dtos
            });
        }

        var deptManaged = groups.FirstOrDefault(g => GroupTypes.IsDepartmentLike(g.Type) && g.ManagerId == userId);
        if (deptManaged != null)
        {
            return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
            {
                Mode = "Approval",
                Groups = new List<GroupDto>(),
                Department = await MapGroupDtoAsync(deptManaged.Id)
            });
        }

        return new ServiceResponse<AttendanceConfigDto>(true, new AttendanceConfigDto
        {
            Mode = "Student",
            Groups = new List<GroupDto>()
        });
    }

    public async Task<string> GetOrganizationKindAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        var orgType = await _context.Organizations
            .AsNoTracking()
            .Where(o => o.Id == organizationId)
            .Select(o => o.OrganizationType)
            .FirstOrDefaultAsync(cancellationToken);

        return orgType == OrganizationType.Corporate ? "Corporate" : "University";
    }

    public async Task<ServiceResponse<IEnumerable<DepartmentSummaryDto>>> GetDepartmentsAsync()
    {
        var organizationId = _userContext.OrganizationId;

        var departments = await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted
                && (g.Type == GroupTypes.Department || g.Type == GroupTypes.Division || g.Type == GroupTypes.Faculty))
            .OrderBy(g => g.Name)
            .Select(g => new DepartmentSummaryDto { Id = g.Id, Name = g.Name })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<DepartmentSummaryDto>>(true, departments);
    }

    public async Task<ServiceResponse<PagedResponse<GroupMemberDto>>> GetGroupMembersAsync(
        Guid groupId,
        PagedRequest request,
        string? q)
    {
        var organizationId = _userContext.OrganizationId;
        if (!await GroupExistsAsync(groupId, organizationId))
            return new ServiceResponse<PagedResponse<GroupMemberDto>>(false, null, new AppError(ErrorCodes.NotFound, "Group not found."));

        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var search = q?.Trim();

        var baseQuery = _context.GroupMembers
            .AsNoTracking()
            .Where(gm => gm.GroupId == groupId && gm.Group.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            baseQuery = baseQuery.Where(gm =>
                (gm.User.FirstName + " " + gm.User.LastName).ToLower().Contains(term)
                || gm.User.Email.ToLower().Contains(term)
                || (gm.RoleInGroup != null && gm.RoleInGroup.ToLower().Contains(term)));
        }

        var total = await baseQuery.CountAsync();

        var items = await baseQuery
            .OrderBy(gm => gm.User.LastName)
            .ThenBy(gm => gm.User.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(gm => new GroupMemberDto
            {
                UserId = gm.UserId,
                FirstName = gm.User.FirstName,
                LastName = gm.User.LastName,
                Email = gm.User.Email,
                RoleInGroup = gm.RoleInGroup,
                AvatarUrl = gm.User.AvatarUrl,
                RoleName = _context.OrganizationMembers
                    .Where(om => om.UserId == gm.UserId && om.OrganizationId == organizationId)
                    .Select(om => om.Role.Name)
                    .FirstOrDefault() ?? "Member"
            })
            .ToListAsync();

        foreach (var row in items)
            row.AvatarUrl = _mediaUrls.ToPublicUrl(row.AvatarUrl);

        return new ServiceResponse<PagedResponse<GroupMemberDto>>(true, new PagedResponse<GroupMemberDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<int>> AddGroupMembersAsync(Guid groupId, AddGroupMembersRequest request)
    {
        var organizationId = _userContext.OrganizationId;
        var group = await _context.Groups
            .FirstOrDefaultAsync(g => g.Id == groupId && g.OrganizationId == organizationId && !g.IsDeleted);
        if (group == null)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.NotFound, "Group not found."));

        var memberUserIds = await _context.OrganizationMembers
            .AsNoTracking()
            .Where(om => om.OrganizationId == organizationId && request.UserIds.Contains(om.UserId))
            .Select(om => om.UserId)
            .ToListAsync();

        if (memberUserIds.Count == 0)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.InvalidInput, "No valid organization members were provided."));

        var existing = await _context.GroupMembers
            .Where(gm => gm.GroupId == groupId && memberUserIds.Contains(gm.UserId))
            .Select(gm => gm.UserId)
            .ToListAsync();

        var toAdd = memberUserIds.Except(existing).ToList();
        var role = string.IsNullOrWhiteSpace(request.RoleInGroup) ? "Member" : request.RoleInGroup.Trim();

        foreach (var userId in toAdd)
        {
            await _uow.Repository<GroupMember>().AddAsync(new GroupMember
            {
                GroupId = groupId,
                UserId = userId,
                RoleInGroup = role,
                JoinedAt = DateTime.UtcNow
            });
        }

        if (GroupTypes.IsDepartmentLike(group.Type))
        {
            foreach (var userId in toAdd)
            {
                var user = await _uow.Repository<User>().GetByIdAsync(userId);
                if (user != null)
                {
                    user.DepartmentId = groupId;
                    _uow.Repository<User>().Update(user);
                }
            }
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<int>(true, toAdd.Count);
    }

    public async Task<ServiceResponse<bool>> RemoveGroupMemberAsync(Guid groupId, Guid userId)
    {
        var organizationId = _userContext.OrganizationId;
        var group = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == groupId && g.OrganizationId == organizationId && !g.IsDeleted);
        if (group == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Group not found."));

        var membership = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId);
        if (membership == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Member not found in this group."));

        _context.GroupMembers.Remove(membership);

        if (GroupTypes.IsDepartmentLike(group.Type))
        {
            var user = await _uow.Repository<User>().GetByIdAsync(userId);
            if (user?.DepartmentId == groupId)
            {
                user.DepartmentId = null;
                _uow.Repository<User>().Update(user);
            }
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<int>> MoveGroupMembersAsync(MoveGroupMembersRequest request)
    {
        var organizationId = _userContext.OrganizationId;

        var source = await _context.Groups
            .FirstOrDefaultAsync(g => g.Id == request.SourceGroupId && g.OrganizationId == organizationId && !g.IsDeleted);
        var target = await _context.Groups
            .FirstOrDefaultAsync(g => g.Id == request.TargetGroupId && g.OrganizationId == organizationId && !g.IsDeleted);

        if (source == null || target == null)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.NotFound, "Source or target group not found."));

        var userIds = request.UserIds.Distinct().ToList();
        var sourceMemberships = await _context.GroupMembers
            .Where(gm => gm.GroupId == request.SourceGroupId && userIds.Contains(gm.UserId))
            .ToListAsync();

        if (sourceMemberships.Count == 0)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.InvalidInput, "None of the selected users belong to the source group."));

        var role = string.IsNullOrWhiteSpace(request.RoleInGroup)
            ? sourceMemberships[0].RoleInGroup ?? "Member"
            : request.RoleInGroup.Trim();

        var moved = 0;
        foreach (var membership in sourceMemberships)
        {
            _context.GroupMembers.Remove(membership);

            var existsInTarget = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.TargetGroupId && gm.UserId == membership.UserId);

            if (!existsInTarget)
            {
                await _uow.Repository<GroupMember>().AddAsync(new GroupMember
                {
                    GroupId = request.TargetGroupId,
                    UserId = membership.UserId,
                    RoleInGroup = role,
                    JoinedAt = DateTime.UtcNow
                });
            }

            if (GroupTypes.IsDepartmentLike(source.Type))
            {
                var user = await _uow.Repository<User>().GetByIdAsync(membership.UserId);
                if (user?.DepartmentId == source.Id)
                {
                    user.DepartmentId = GroupTypes.IsDepartmentLike(target.Type) ? target.Id : null;
                    _uow.Repository<User>().Update(user);
                }
            }
            else if (GroupTypes.IsDepartmentLike(target.Type))
            {
                var user = await _uow.Repository<User>().GetByIdAsync(membership.UserId);
                if (user != null)
                {
                    user.DepartmentId = target.Id;
                    _uow.Repository<User>().Update(user);
                }
            }

            moved++;
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<int>(true, moved);
    }

    private async Task<GroupDto> MapGroupDtoAsync(Guid groupId)
    {
        var row = await _context.Groups
            .AsNoTracking()
            .Where(g => g.Id == groupId)
            .Select(g => new GroupDto
            {
                Id = g.Id,
                Name = g.Name,
                Type = g.Type,
                ParentGroupId = g.ParentGroupId,
                ManagerId = g.ManagerId,
                MemberCount = g.Members.Count,
                ChildCount = g.SubGroups.Count(c => !c.IsDeleted)
            })
            .FirstAsync();

        return row;
    }

    private async Task<bool> GroupExistsAsync(Guid groupId, Guid organizationId) =>
        await _context.Groups.AnyAsync(g =>
            g.Id == groupId && g.OrganizationId == organizationId && !g.IsDeleted);

    private async Task<AppError?> ValidateParentAsync(Guid organizationId, Guid? groupId, Guid? parentGroupId)
    {
        if (!parentGroupId.HasValue)
            return null;

        if (groupId.HasValue && parentGroupId.Value == groupId.Value)
            return new AppError(ErrorCodes.InvalidInput, "A group cannot be its own parent.");

        var parent = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(g =>
                g.Id == parentGroupId.Value && g.OrganizationId == organizationId && !g.IsDeleted);

        if (parent == null)
            return new AppError(ErrorCodes.NotFound, "Parent group not found.");

        if (!groupId.HasValue)
            return null;

        var cursor = parent.ParentGroupId;
        while (cursor.HasValue)
        {
            if (cursor.Value == groupId.Value)
                return new AppError(ErrorCodes.InvalidInput, "Invalid parent: would create a cycle in the hierarchy.");
            cursor = await _context.Groups
                .AsNoTracking()
                .Where(g => g.Id == cursor.Value)
                .Select(g => g.ParentGroupId)
                .FirstOrDefaultAsync();
        }

        return null;
    }

    private async Task EnsureManagerMembershipAsync(Guid groupId, Guid managerId)
    {
        var exists = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == managerId);
        if (!exists)
        {
            await _uow.Repository<GroupMember>().AddAsync(new GroupMember
            {
                GroupId = groupId,
                UserId = managerId,
                RoleInGroup = "Leader",
                JoinedAt = DateTime.UtcNow
            });
        }
    }

    private async Task SoftDeleteGroupRecursiveAsync(Guid groupId)
    {
        var childIds = await _context.Groups
            .Where(g => g.ParentGroupId == groupId && !g.IsDeleted)
            .Select(g => g.Id)
            .ToListAsync();

        foreach (var childId in childIds)
            await SoftDeleteGroupRecursiveAsync(childId);

        var group = await _uow.Repository<Group>().GetByIdAsync(groupId);
        if (group != null)
            _uow.Repository<Group>().Remove(group);

        var memberships = await _context.GroupMembers.Where(gm => gm.GroupId == groupId).ToListAsync();
        _context.GroupMembers.RemoveRange(memberships);
    }

    private static void SortTree(List<GroupTreeNodeDto> nodes)
    {
        nodes.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
        foreach (var node in nodes)
            SortTree((List<GroupTreeNodeDto>)node.Children);
    }
}
