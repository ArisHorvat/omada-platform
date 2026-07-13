using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Users;
using Omada.Api.Infrastructure;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class UserService : IUserService
{
    private static readonly JsonSerializerOptions JsonWriteOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly JsonSerializerOptions JsonReadOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IPublicMediaUrlResolver _mediaUrls;
    private readonly IGroupScopeService _groupScope;

    public UserService(
        IUnitOfWork uow,
        IUserContext userContext,
        IPublicMediaUrlResolver mediaUrls,
        IGroupScopeService groupScope)
    {
        _uow = uow;
        _userContext = userContext;
        _mediaUrls = mediaUrls;
        _groupScope = groupScope;
    }

    public async Task<ServiceResponse<UserProfileDto>> GetUserProfileAsync()
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<UserProfileDto>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var orgMember = (await _uow.Repository<OrganizationMember>()
                .FindAsync(m => m.UserId == userId && m.OrganizationId == orgId))
            .FirstOrDefault();

        var widgetAccess = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (orgMember != null)
        {
            var rolePermissions = await _uow.Repository<RolePermission>()
                .FindAsync(rp => rp.RoleId == orgMember.RoleId);

            foreach (var perm in rolePermissions)
            {
                if (OrganizationWidgetKeys.IsCoreWidget(perm.WidgetKey))
                    continue;
                widgetAccess[perm.WidgetKey] = perm.AccessLevel.ToString().ToLower();
            }
        }

        var org = await _uow.Repository<Organization>().GetByIdAsync(orgId);
        if (org != null)
        {
            widgetAccess = widgetAccess
                .Where(kv => OrganizationWidgetKeys.IsPermissionAllowedForOrg(org, kv.Key))
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.OrdinalIgnoreCase);

            var enabledKeys = OrganizationWidgetKeys.GetEffectiveEnabledKeys(org);
            widgetAccess = widgetAccess
                .Where(kv =>
                    OrganizationWidgetKeys.IsCoreWidget(kv.Key) ||
                    enabledKeys.Contains(kv.Key) ||
                    (kv.Key.Equals(WidgetKeys.Chat, StringComparison.OrdinalIgnoreCase) &&
                     enabledKeys.Contains(WidgetKeys.Announcements)) ||
                    (kv.Key.Equals(WidgetKeys.News, StringComparison.OrdinalIgnoreCase) &&
                     enabledKeys.Contains(WidgetKeys.Announcements)))
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.OrdinalIgnoreCase);

            ConsolidateCommunicationWidgetAccess(widgetAccess);

            if (widgetAccess.ContainsKey(WidgetKeys.Tasks))
                widgetAccess.Remove(WidgetKeys.Assignments);
        }

        var preferences = ParsePreferencesJson(user.PreferencesJson);

        return new ServiceResponse<UserProfileDto>(true, new UserProfileDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.PhoneNumber,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(user.AvatarUrl) ? null : user.AvatarUrl),
            Address = user.Address,
            Bio = user.Bio,
            Title = user.Title,
            DepartmentId = user.DepartmentId,
            ManagerId = user.ManagerId,
            ThemePreference = user.ThemePreference,
            LanguagePreference = user.LanguagePreference,
            IsPublicInDirectory = user.IsPublicInDirectory,
            Preferences = preferences,
            IsTwoFactorEnabled = user.IsTwoFactorEnabled,
            WidgetAccess = widgetAccess,
        });
    }

    public async Task<ServiceResponse<PagedResponse<UserDirectoryItemDto>>> GetUserDirectoryAsync(
        PagedRequest request,
        string? q,
        string? role,
        Guid? managerId,
        Guid? departmentId,
        Guid? groupId)
    {
        var viewerUserId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var membersRo = _uow.Repository<OrganizationMember>().GetQueryable().AsNoTracking();
        var usersRo = _uow.Repository<User>().GetQueryable().AsNoTracking();
        var rolesRo = _uow.Repository<Role>().GetQueryable().AsNoTracking();
        var groupsRo = _uow.Repository<Group>().GetQueryable().AsNoTracking();
        var groupMembersRo = _uow.Repository<GroupMember>().GetQueryable().AsNoTracking();

        var viewerRoleName = await (
            from m in membersRo
            join r in rolesRo on m.RoleId equals r.Id
            where m.OrganizationId == orgId && m.UserId == viewerUserId && m.IsActive
            select r.Name
        ).FirstOrDefaultAsync();

        var viewerIsStudent = string.Equals(viewerRoleName, "Student", StringComparison.OrdinalIgnoreCase);

        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 100);

        var trimmedQ = string.IsNullOrWhiteSpace(q) ? null : q.Trim();
        var loweredQ = trimmedQ?.ToLowerInvariant();
        var trimmedRole = string.IsNullOrWhiteSpace(role) ? null : role.Trim();

        var baseQuery =
            from m in membersRo
            join u in usersRo on m.UserId equals u.Id
            join r in rolesRo on m.RoleId equals r.Id
            where m.OrganizationId == orgId && m.IsActive
            select new
            {
                User = u,
                RoleName = r.Name
            };

        if (!string.IsNullOrWhiteSpace(trimmedRole))
            baseQuery = baseQuery.Where(x => x.RoleName == trimmedRole);

        if (managerId.HasValue)
            baseQuery = baseQuery.Where(x => x.User.ManagerId == managerId.Value);

        if (departmentId.HasValue)
            baseQuery = baseQuery.Where(x => x.User.DepartmentId == departmentId.Value);

        if (groupId.HasValue)
        {
            var scopeIds = await _groupScope.GetDescendantIdsAsync(orgId, groupId.Value, includeSelf: true);
            var scopedUserIds = groupMembersRo
                .Where(gm => scopeIds.Contains(gm.GroupId))
                .Select(gm => gm.UserId)
                .Distinct();
            baseQuery = baseQuery.Where(x => scopedUserIds.Contains(x.User.Id));
        }

        if (!string.IsNullOrWhiteSpace(loweredQ))
        {
            baseQuery = baseQuery.Where(x =>
                (x.User.FirstName ?? string.Empty).ToLower().Contains(loweredQ) ||
                (x.User.LastName ?? string.Empty).ToLower().Contains(loweredQ) ||
                (x.User.Email ?? string.Empty).ToLower().Contains(loweredQ) ||
                (x.User.Title ?? string.Empty).ToLower().Contains(loweredQ));
        }

        var totalCount = await baseQuery.CountAsync();

        var itemsQuery = baseQuery
            .OrderBy(x => x.User.LastName)
            .ThenBy(x => x.User.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserDirectoryItemDto
            {
                Id = x.User.Id,
                FirstName = x.User.FirstName,
                LastName = x.User.LastName,
                Title = x.User.Title,
                DepartmentId = x.User.DepartmentId,
                DepartmentName = x.User.DepartmentId == null
                    ? null
                    : groupsRo.Where(g => g.Id == x.User.DepartmentId).Select(g => g.Name).FirstOrDefault(),
                ManagerId = x.User.ManagerId,
                RoleName = x.RoleName,
                AvatarUrl = x.User.AvatarUrl,
                Email =
                    viewerIsStudent && x.User.Id != viewerUserId && x.RoleName == "Student"
                        ? null
                        : (x.User.IsPublicInDirectory ? x.User.Email : null),
                Phone =
                    viewerIsStudent && x.User.Id != viewerUserId && x.RoleName == "Student"
                        ? null
                        : (x.User.IsPublicInDirectory ? x.User.PhoneNumber : null),
            });

        var items = await itemsQuery.ToListAsync();
        foreach (var row in items)
            row.AvatarUrl = _mediaUrls.ToPublicUrl(row.AvatarUrl);

        return new ServiceResponse<PagedResponse<UserDirectoryItemDto>>(true, new PagedResponse<UserDirectoryItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<IReadOnlyList<string>>> GetDirectoryRoleNamesAsync()
    {
        var orgId = _userContext.OrganizationId;

        var rolesRo = _uow.Repository<Role>().GetQueryable().AsNoTracking();

        var roleNames = await rolesRo
            .Where(r => r.OrganizationId == orgId)
            .OrderBy(r => r.Name)
            .Select(r => r.Name)
            .ToListAsync();

        return new ServiceResponse<IReadOnlyList<string>>(true, roleNames);
    }

    public async Task<ServiceResponse<UserDeepProfileDto>> GetUserDeepProfileAsync(Guid id)
    {
        var viewerUserId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var membersRo = _uow.Repository<OrganizationMember>().GetQueryable().AsNoTracking();
        var usersRo = _uow.Repository<User>().GetQueryable().AsNoTracking();
        var rolesRo = _uow.Repository<Role>().GetQueryable().AsNoTracking();
        var groupsRo = _uow.Repository<Group>().GetQueryable().AsNoTracking();
        var groupMembersRo = _uow.Repository<GroupMember>().GetQueryable().AsNoTracking();

        var viewerRoleName = await (
            from m in membersRo
            join r in rolesRo on m.RoleId equals r.Id
            where m.OrganizationId == orgId && m.UserId == viewerUserId && m.IsActive
            select r.Name
        ).FirstOrDefaultAsync();

        var viewerIsStudent = string.Equals(viewerRoleName, "Student", StringComparison.OrdinalIgnoreCase);

        var target = await (
            from m in membersRo
            join u in usersRo on m.UserId equals u.Id
            join r in rolesRo on m.RoleId equals r.Id
            where m.OrganizationId == orgId && m.IsActive && u.Id == id
            select new { User = u, RoleName = r.Name }
        ).FirstOrDefaultAsync();

        if (target == null)
            return new ServiceResponse<UserDeepProfileDto>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var canShowContact =
            !(viewerIsStudent && target.User.Id != viewerUserId && target.RoleName == "Student");

        var email = canShowContact && target.User.IsPublicInDirectory ? target.User.Email : null;
        var phone = canShowContact && target.User.IsPublicInDirectory ? target.User.PhoneNumber : null;

        string? departmentName = null;
        if (target.User.DepartmentId.HasValue)
        {
            departmentName = await groupsRo
                .Where(g => g.Id == target.User.DepartmentId.Value)
                .Select(g => g.Name)
                .FirstOrDefaultAsync();
        }

        var userGroups = await (
            from gm in groupMembersRo
            join g in groupsRo on gm.GroupId equals g.Id
            where gm.UserId == id && g.OrganizationId == orgId
            orderby g.Name
            select new UserGroupSummaryDto
            {
                Id = g.Id,
                Name = g.Name,
                Type = g.Type,
            }
        ).ToListAsync();

        return new ServiceResponse<UserDeepProfileDto>(true, new UserDeepProfileDto
        {
            Id = target.User.Id,
            FirstName = target.User.FirstName,
            LastName = target.User.LastName,
            RoleName = target.RoleName,
            Title = target.User.Title,
            DepartmentId = target.User.DepartmentId,
            DepartmentName = departmentName,
            ManagerId = target.User.ManagerId,
            Email = email,
            Phone = phone,
            AvatarUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(target.User.AvatarUrl) ? null : target.User.AvatarUrl),
            Address = target.User.Address,
            Bio = target.User.Bio,
            IsPublicInDirectory = target.User.IsPublicInDirectory,
            Groups = userGroups,
        });
    }

    public async Task<ServiceResponse<string>> UpdateProfileAsync(UpdateProfileRequest request)
    {
        var userId = _userContext.UserId;

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        user.PhoneNumber = request.PhoneNumber;
        user.Address = request.Address;
        if (request.AvatarUrl != null)
            user.AvatarUrl = request.AvatarUrl;

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Profile updated successfully");
    }

    public async Task<ServiceResponse<string>> UpdateMyProfileAsync(UpdateMyProfileRequest request)
    {
        var userId = _userContext.UserId;

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        if (request.Bio != null)
            user.Bio = request.Bio;
        if (request.AvatarUrl != null)
            user.AvatarUrl = request.AvatarUrl;
        if (request.PhoneNumber != null)
            user.PhoneNumber = request.PhoneNumber;
        if (request.Address != null)
            user.Address = request.Address;
        if (request.ThemePreference != null)
            user.ThemePreference = request.ThemePreference;
        if (request.LanguagePreference != null)
            user.LanguagePreference = request.LanguagePreference;
        if (request.IsPublicInDirectory.HasValue)
            user.IsPublicInDirectory = request.IsPublicInDirectory.Value;
        if (request.Preferences != null)
            user.PreferencesJson = JsonSerializer.Serialize(request.Preferences, JsonWriteOptions);

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Profile updated successfully");
    }

    public async Task<ServiceResponse<string>> UpdateSecurityAsync(UpdateSecurityRequest request)
    {
        var userId = _userContext.UserId;

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        user.IsTwoFactorEnabled = request.IsTwoFactorEnabled;

        if (!request.IsTwoFactorEnabled)
            ClearTwoFactorPendingFields(user);

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Security settings updated");
    }

    public async Task<ServiceResponse<string>> ChangePasswordAsync(ChangePasswordRequest request)
    {
        var userId = _userContext.UserId;
        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.InvalidInput, "Current password is incorrect."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpires = null;
        user.PasswordResetTokenPurpose = null;
        user.PasswordResetTokenPurpose = null;

        var refreshTokens = await _uow.Repository<RefreshToken>()
            .GetQueryable()
            .Where(t => t.UserId == userId)
            .ToListAsync();
        foreach (var token in refreshTokens)
            token.IsRevoked = true;

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Password updated successfully.");
    }

    public async Task<ServiceResponse<string>> SoftDeleteMyAccountAsync()
    {
        var userId = _userContext.UserId;

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var tokens = await _uow.Repository<RefreshToken>()
            .GetQueryable()
            .Where(t => t.UserId == userId)
            .ToListAsync();
        foreach (var t in tokens)
            t.IsRevoked = true;

        var anonymizedEmail = $"deleted.user.{user.Id:N}@invalid.omada.local";
        user.FirstName = "Deleted";
        user.LastName = "User";
        user.Email = anonymizedEmail;
        user.PhoneNumber = null;
        user.Bio = null;
        user.AvatarUrl = null;
        user.Address = null;
        user.Title = null;
        user.DepartmentId = null;
        user.ManagerId = null;
        user.CNP = null;
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpires = null;
        user.PasswordResetTokenPurpose = null;
        user.TwoFactorPendingSessionToken = null;
        user.TwoFactorCode = null;
        user.TwoFactorCodeExpires = null;
        user.PreferencesJson = null;
        user.ThemePreference = "system";
        user.LanguagePreference = "en";
        user.IsPublicInDirectory = false;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"));
        user.IsDeleted = true;

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Your account has been deleted and personal data anonymized.");
    }

    public async Task<ServiceResponse<byte[]>> ExportMyDataJsonAsync()
    {
        var userId = _userContext.UserId;

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null)
            return new ServiceResponse<byte[]>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var membersQ = _uow.Repository<OrganizationMember>().GetQueryable().IgnoreQueryFilters().AsNoTracking();
        var orgsQ = _uow.Repository<Organization>().GetQueryable().AsNoTracking();
        var rolesQ = _uow.Repository<Role>().GetQueryable().IgnoreQueryFilters().AsNoTracking();

        var memberships = await (
            from m in membersQ
            where m.UserId == userId
            join o in orgsQ on m.OrganizationId equals o.Id into og
            from o in og.DefaultIfEmpty()
            join r in rolesQ on m.RoleId equals r.Id into rg
            from r in rg.DefaultIfEmpty()
            select new OrganizationMembershipExportSection
            {
                OrganizationId = m.OrganizationId,
                OrganizationName = o != null ? o.Name : "(unknown organization)",
                RoleName = r != null ? r.Name : "(unknown role)",
                JoinedAt = m.JoinedAt,
                IsActive = m.IsActive,
            }).ToListAsync();

        var tasks = await _uow.Repository<TaskItem>()
            .GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(t => (t.AssigneeId == userId || t.CreatedByUserId == userId) && !t.IsDeleted)
            .Select(t => new TaskExportSection
            {
                Id = t.Id,
                OrganizationId = t.OrganizationId,
                Title = t.Title,
                IsCompleted = t.IsCompleted,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
            })
            .ToListAsync();

        var messages = await _uow.Repository<Message>()
            .GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.UserId == userId && !m.IsDeleted)
            .Select(m => new MessageExportSection
            {
                Id = m.Id,
                OrganizationId = m.OrganizationId,
                DisplayNameSnapshot = m.UserName,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
            })
            .ToListAsync();

        var export = new GdprDataExportDto
        {
            ExportedAtUtc = DateTime.UtcNow,
            Profile = new UserProfileExportSection
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                ThemePreference = user.ThemePreference,
                LanguagePreference = user.LanguagePreference,
                IsPublicInDirectory = user.IsPublicInDirectory,
                IsTwoFactorEnabled = user.IsTwoFactorEnabled,
                Preferences = ParsePreferencesJson(user.PreferencesJson),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
            },
            OrganizationMemberships = memberships,
            Tasks = tasks,
            Messages = messages,
        };

        var json = JsonSerializer.Serialize(export, JsonWriteOptions);
        return new ServiceResponse<byte[]>(true, System.Text.Encoding.UTF8.GetBytes(json));
    }

    private static Dictionary<string, bool> ParsePreferencesJson(string? json)
    {
        var empty = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(json))
            return empty;

        try
        {
            var parsed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, JsonReadOptions);
            if (parsed == null)
                return empty;

            foreach (var kv in parsed)
            {
                if (kv.Value.ValueKind == JsonValueKind.True)
                    empty[kv.Key] = true;
                else if (kv.Value.ValueKind == JsonValueKind.False)
                    empty[kv.Key] = false;
            }

            return empty;
        }
        catch
        {
            return empty;
        }
    }

    private static void ClearTwoFactorPendingFields(User user)
    {
        user.TwoFactorPendingSessionToken = null;
        user.TwoFactorCode = null;
        user.TwoFactorCodeExpires = null;
    }

    /// <summary>Merges legacy chat/news role rows into a single announcements entry for the mobile client.</summary>
    private static void ConsolidateCommunicationWidgetAccess(Dictionary<string, string> widgetAccess)
    {
        var rank = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["view"] = 1,
            ["edit"] = 2,
            ["admin"] = 3,
        };

        var bestRank = 0;
        string? bestLevel = null;

        foreach (var key in new[] { WidgetKeys.Announcements, WidgetKeys.Chat, WidgetKeys.News })
        {
            if (!widgetAccess.TryGetValue(key, out var level))
                continue;

            var r = rank.GetValueOrDefault(level, 0);
            if (r > bestRank)
            {
                bestRank = r;
                bestLevel = level;
            }
        }

        widgetAccess.Remove(WidgetKeys.Chat);
        widgetAccess.Remove(WidgetKeys.News);

        if (bestLevel != null)
            widgetAccess[WidgetKeys.Announcements] = bestLevel;
    }
}
