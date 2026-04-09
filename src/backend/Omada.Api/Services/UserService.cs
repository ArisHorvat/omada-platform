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

    public UserService(IUnitOfWork uow, IUserContext userContext, IPublicMediaUrlResolver mediaUrls)
    {
        _uow = uow;
        _userContext = userContext;
        _mediaUrls = mediaUrls;
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
                widgetAccess[perm.WidgetKey] = perm.AccessLevel.ToString().ToLower();
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
        Guid? departmentId)
    {
        var viewerUserId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var membersRo = _uow.Repository<OrganizationMember>().GetQueryable().AsNoTracking();
        var usersRo = _uow.Repository<User>().GetQueryable().AsNoTracking();
        var rolesRo = _uow.Repository<Role>().GetQueryable().AsNoTracking();

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

    public async Task<ServiceResponse<UserDeepProfileDto>> GetUserDeepProfileAsync(Guid id)
    {
        var viewerUserId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var membersRo = _uow.Repository<OrganizationMember>().GetQueryable().AsNoTracking();
        var usersRo = _uow.Repository<User>().GetQueryable().AsNoTracking();
        var rolesRo = _uow.Repository<Role>().GetQueryable().AsNoTracking();

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

        return new ServiceResponse<UserDeepProfileDto>(true, new UserDeepProfileDto
        {
            Id = target.User.Id,
            FirstName = target.User.FirstName,
            LastName = target.User.LastName,
            RoleName = target.RoleName,
            Title = target.User.Title,
            DepartmentId = target.User.DepartmentId,
            ManagerId = target.User.ManagerId,
            Email = email,
            Phone = phone,
            AvatarUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(target.User.AvatarUrl) ? null : target.User.AvatarUrl),
            Address = target.User.Address,
            Bio = target.User.Bio,
            IsPublicInDirectory = target.User.IsPublicInDirectory
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

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Security settings updated");
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
}
