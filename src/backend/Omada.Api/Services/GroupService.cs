using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Groups;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Users;
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
    private readonly IGroupScopeService _groupScope;

    public GroupService(
        IUnitOfWork uow,
        IUserContext userContext,
        IPermissionService permissionService,
        ApplicationDbContext context,
        IPublicMediaUrlResolver mediaUrls,
        IGroupScopeService groupScope)
    {
        _uow = uow;
        _userContext = userContext;
        _permissionService = permissionService;
        _context = context;
        _mediaUrls = mediaUrls;
        _groupScope = groupScope;
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
            ScheduleConfig = request.ScheduleConfig,
            AcademicYear = string.IsNullOrWhiteSpace(request.AcademicYear) ? null : request.AcademicYear.Trim()
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
        group.AcademicYear = string.IsNullOrWhiteSpace(request.AcademicYear) ? null : request.AcademicYear.Trim();
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

        var rollupCounts = await _groupScope.GetRollupMemberCountsAsync(organizationId);
        var rollupForGroup = rollupCounts.TryGetValue(id, out var rollup) ? rollup : group.MemberCount;

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

        foreach (var child in children)
        {
            if (rollupCounts.TryGetValue(child.Id, out var childRollup))
                child.MemberCount = childRollup;
        }

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
            DirectMemberCount = group.MemberCount,
            MemberCount = rollupForGroup,
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

        var rollupCounts = await _groupScope.GetRollupMemberCountsAsync(organizationId);
        ApplyRollupCounts(roots, rollupCounts);

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
                TypeLabel = GroupTypes.GetDisplayLabel(orgType, r.Type)
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
                GroupTypes.Program, GroupTypes.Series, GroupTypes.Group, GroupTypes.Subgroup,
                GroupTypes.Cohort, GroupTypes.Class, GroupTypes.Subject,
                GroupTypes.Team, GroupTypes.Project
            },
            "grade" or "grades" => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Program, GroupTypes.Series, GroupTypes.Group, GroupTypes.Subgroup,
                GroupTypes.Cohort, GroupTypes.Class, GroupTypes.Subject,
                GroupTypes.Department, GroupTypes.Faculty, GroupTypes.Division
            },
            "attendance" => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Program, GroupTypes.Series, GroupTypes.Group, GroupTypes.Subgroup,
                GroupTypes.Cohort, GroupTypes.Class, GroupTypes.Subject,
                GroupTypes.Team, GroupTypes.Squad, GroupTypes.Project,
                GroupTypes.Department, GroupTypes.Division, GroupTypes.Faculty
            },
            _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Program, GroupTypes.Series, GroupTypes.Group, GroupTypes.Subgroup,
                GroupTypes.Cohort, GroupTypes.Class, GroupTypes.Subject,
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
            .Where(g => GroupTypes.IsSessionManagedGroup(g.Type) && g.ManagerId == userId)
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

    public async Task<ServiceResponse<IReadOnlyList<DirectoryGroupOptionDto>>> GetDirectoryFilterGroupsAsync()
    {
        var treeResult = await GetGroupTreeAsync();
        if (!treeResult.IsSuccess)
            return new ServiceResponse<IReadOnlyList<DirectoryGroupOptionDto>>(false, null, treeResult.Error);

        var flat = new List<DirectoryGroupOptionDto>();
        AppendDirectoryGroupOptions(treeResult.Data ?? [], flat, 0);
        return new ServiceResponse<IReadOnlyList<DirectoryGroupOptionDto>>(true, flat);
    }

    private static void AppendDirectoryGroupOptions(
        IEnumerable<GroupTreeNodeDto> nodes,
        List<DirectoryGroupOptionDto> flat,
        int depth)
    {
        foreach (var node in nodes.OrderBy(n => n.Name, StringComparer.OrdinalIgnoreCase))
        {
            flat.Add(new DirectoryGroupOptionDto
            {
                Id = node.Id,
                Name = node.Name,
                Type = node.Type,
                Depth = depth,
                MemberCount = node.MemberCount,
            });
            AppendDirectoryGroupOptions(node.Children, flat, depth + 1);
        }
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
        var search = q?.Trim().ToLowerInvariant();

        var scopeIds = await _groupScope.GetDescendantIdsAsync(organizationId, groupId, includeSelf: true);
        var groupNames = await _context.Groups
            .AsNoTracking()
            .Where(g => scopeIds.Contains(g.Id))
            .ToDictionaryAsync(g => g.Id, g => g.Name);

        var rows = await _context.GroupMembers
            .AsNoTracking()
            .Where(gm => scopeIds.Contains(gm.GroupId) && gm.Group.OrganizationId == organizationId && !gm.Group.IsDeleted)
            .Select(gm => new
            {
                gm.GroupId,
                gm.UserId,
                gm.User.FirstName,
                gm.User.LastName,
                gm.User.Email,
                gm.RoleInGroup,
                gm.User.AvatarUrl,
                RoleName = _context.OrganizationMembers
                    .Where(om => om.UserId == gm.UserId && om.OrganizationId == organizationId)
                    .Select(om => om.Role.Name)
                    .FirstOrDefault() ?? "Member"
            })
            .ToListAsync();

        var depthByGroup = await _groupScope.GetDepthsAsync(organizationId, scopeIds);

        var rolledUp = new Dictionary<Guid, (Guid PlacementGroupId, string FirstName, string LastName, string? Email, string? RoleInGroup, string? AvatarUrl, string RoleName)>();
        foreach (var row in rows)
        {
            var depth = depthByGroup.GetValueOrDefault(row.GroupId);
            if (rolledUp.TryGetValue(row.UserId, out var existing))
            {
                var existingDepth = depthByGroup.GetValueOrDefault(existing.PlacementGroupId);
                if (depth <= existingDepth)
                    continue;
            }

            rolledUp[row.UserId] = (
                row.GroupId,
                row.FirstName,
                row.LastName,
                row.Email,
                row.RoleInGroup,
                row.AvatarUrl,
                row.RoleName);
        }

        var filtered = rolledUp
            .Where(kv =>
            {
                if (string.IsNullOrWhiteSpace(search))
                    return true;

                var name = $"{kv.Value.FirstName} {kv.Value.LastName}".ToLowerInvariant();
                return name.Contains(search)
                       || (kv.Value.Email != null && kv.Value.Email.ToLowerInvariant().Contains(search))
                       || (kv.Value.RoleInGroup != null && kv.Value.RoleInGroup.ToLowerInvariant().Contains(search))
                       || (groupNames.TryGetValue(kv.Value.PlacementGroupId, out var gName) && gName.ToLowerInvariant().Contains(search));
            })
            .OrderBy(kv => kv.Value.LastName)
            .ThenBy(kv => kv.Value.FirstName)
            .ToList();

        var total = filtered.Count;
        var pageItems = filtered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(kv =>
            {
                var placementId = kv.Value.PlacementGroupId;
                groupNames.TryGetValue(placementId, out var placementName);
                return new GroupMemberDto
                {
                    UserId = kv.Key,
                    FirstName = kv.Value.FirstName,
                    LastName = kv.Value.LastName,
                    Email = kv.Value.Email,
                    RoleInGroup = kv.Value.RoleInGroup,
                    AvatarUrl = _mediaUrls.ToPublicUrl(kv.Value.AvatarUrl),
                    RoleName = kv.Value.RoleName,
                    PlacementGroupId = placementId,
                    PlacementGroupName = placementName ?? "Group",
                    IsDirectMember = placementId == groupId
                };
            })
            .ToList();

        return new ServiceResponse<PagedResponse<GroupMemberDto>>(true, new PagedResponse<GroupMemberDto>
        {
            Items = pageItems,
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

    public async Task<ServiceResponse<bool>> RemoveGroupMemberAsync(Guid scopeGroupId, Guid userId, Guid? placementGroupId = null)
    {
        var organizationId = _userContext.OrganizationId;
        var scopeGroup = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == scopeGroupId && g.OrganizationId == organizationId && !g.IsDeleted);
        if (scopeGroup == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Group not found."));

        var scopeIds = await _groupScope.GetDescendantIdsAsync(organizationId, scopeGroupId, includeSelf: true);

        GroupMember? membership;
        if (placementGroupId.HasValue)
        {
            if (!scopeIds.Contains(placementGroupId.Value))
                return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.InvalidInput, "Placement group is outside this scope."));

            membership = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == placementGroupId.Value && gm.UserId == userId);
        }
        else
        {
            var candidates = await _context.GroupMembers
                .Where(gm => gm.UserId == userId && scopeIds.Contains(gm.GroupId))
                .ToListAsync();

            if (candidates.Count == 0)
                membership = null;
            else if (candidates.Count == 1)
                membership = candidates[0];
            else
            {
                var deepest = candidates[0];
                var deepestDepth = await _groupScope.GetDepthAsync(organizationId, deepest.GroupId);
                foreach (var candidate in candidates.Skip(1))
                {
                    var depth = await _groupScope.GetDepthAsync(organizationId, candidate.GroupId);
                    if (depth > deepestDepth)
                    {
                        deepest = candidate;
                        deepestDepth = depth;
                    }
                }

                membership = deepest;
            }
        }

        if (membership == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Member not found in this group."));

        var placementGroup = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == membership.GroupId);

        _context.GroupMembers.Remove(membership);

        if (placementGroup != null && GroupTypes.IsDepartmentLike(placementGroup.Type))
        {
            var user = await _uow.Repository<User>().GetByIdAsync(userId);
            if (user?.DepartmentId == placementGroup.Id)
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
        var scopeIds = await _groupScope.GetDescendantIdsAsync(organizationId, request.SourceGroupId, includeSelf: true);
        var candidateMemberships = await _context.GroupMembers
            .Where(gm => scopeIds.Contains(gm.GroupId) && userIds.Contains(gm.UserId))
            .ToListAsync();

        var sourceMemberships = new List<GroupMember>();
        foreach (var uid in userIds)
        {
            var perUser = candidateMemberships.Where(gm => gm.UserId == uid).ToList();
            if (perUser.Count == 0)
                continue;

            if (perUser.Count == 1)
            {
                sourceMemberships.Add(perUser[0]);
                continue;
            }

            var deepest = perUser[0];
            var deepestDepth = await _groupScope.GetDepthAsync(organizationId, deepest.GroupId);
            foreach (var candidate in perUser.Skip(1))
            {
                var depth = await _groupScope.GetDepthAsync(organizationId, candidate.GroupId);
                if (depth > deepestDepth)
                {
                    deepest = candidate;
                    deepestDepth = depth;
                }
            }

            sourceMemberships.Add(deepest);
        }

        if (sourceMemberships.Count == 0)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.InvalidInput, "None of the selected users belong to this group or its sub-groups."));

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
                AcademicYear = g.AcademicYear,
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

    private static void ApplyRollupCounts(
        IEnumerable<GroupTreeNodeDto> nodes,
        IReadOnlyDictionary<Guid, int> rollupCounts)
    {
        foreach (var node in nodes)
        {
            if (rollupCounts.TryGetValue(node.Id, out var count))
                node.MemberCount = count;

            ApplyRollupCounts(node.Children, rollupCounts);
        }
    }

    private static void SortTree(List<GroupTreeNodeDto> nodes)
    {
        nodes.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
        foreach (var node in nodes)
            SortTree((List<GroupTreeNodeDto>)node.Children);
    }
}
