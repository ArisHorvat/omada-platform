using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class OrganizationAdminService : IOrganizationAdminService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IPublicMediaUrlResolver _mediaUrls;
    private readonly IInviteLinkBuilder _inviteLinks;
    private readonly IEmailService _emailService;
    private readonly IPermissionCacheInvalidator _permissionCacheInvalidator;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<OrganizationAdminService> _logger;

    public OrganizationAdminService(
        IUnitOfWork uow,
        IUserContext userContext,
        IPublicMediaUrlResolver mediaUrls,
        IInviteLinkBuilder inviteLinks,
        IEmailService emailService,
        IPermissionCacheInvalidator permissionCacheInvalidator,
        IAuditLogService auditLogService,
        ILogger<OrganizationAdminService> logger)
    {
        _uow = uow;
        _userContext = userContext;
        _mediaUrls = mediaUrls;
        _inviteLinks = inviteLinks;
        _emailService = emailService;
        _permissionCacheInvalidator = permissionCacheInvalidator;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<ServiceResponse<OrganizationDetailsDto>> GetCurrentAsync()
    {
        var org = await LoadCurrentOrganizationAsync();
        if (org == null)
            return Fail<OrganizationDetailsDto>(ErrorCodes.NotFound, "Organization not found.");

        return Ok(await MapOrganizationDetailsAsync(org));
    }

    public async Task<ServiceResponse<OrganizationDetailsDto>> UpdateCurrentAsync(UpdateCurrentOrganizationRequest request)
    {
        var org = await LoadCurrentOrganizationAsync();
        if (org == null)
            return Fail<OrganizationDetailsDto>(ErrorCodes.NotFound, "Organization not found.");

        org.Name = request.Name.Trim();
        org.ShortName = string.IsNullOrWhiteSpace(request.ShortName) ? org.ShortName : request.ShortName.Trim();
        org.EmailDomain = string.IsNullOrWhiteSpace(request.EmailDomain) ? org.EmailDomain : request.EmailDomain.Trim();
        org.PrimaryColor = request.PrimaryColor;
        org.SecondaryColor = request.SecondaryColor;
        org.TertiaryColor = request.TertiaryColor;
        if (request.LogoUrl != null)
            org.LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();
        if (request.OnboardingStep.HasValue)
            org.OnboardingStep = request.OnboardingStep.Value;
        if (request.OrganizationType.HasValue)
            org.OrganizationType = request.OrganizationType.Value;
        if (request.IsActive.HasValue)
            org.IsActive = request.IsActive.Value;

        _uow.Repository<Organization>().Update(org);
        await _uow.CompleteAsync();

        await _auditLogService.RecordAsync(
            OrgId,
            _userContext.UserId,
            "org.settings.update",
            $"Updated organization settings for {org.Name}");

        return Ok(await MapOrganizationDetailsAsync(org));
    }

    public async Task<ServiceResponse<RegenerateInviteCodeResponse>> RegenerateInviteCodeAsync()
    {
        var org = await LoadCurrentOrganizationAsync();
        if (org == null)
            return Fail<RegenerateInviteCodeResponse>(ErrorCodes.NotFound, "Organization not found.");

        org.InviteCode = OrganizationInviteCodeGenerator.Generate();
        _uow.Repository<Organization>().Update(org);
        await _uow.CompleteAsync();

        await _auditLogService.RecordAsync(
            OrgId,
            _userContext.UserId,
            "org.invite_code.regenerate",
            "Regenerated organization invite code");

        return Ok(new RegenerateInviteCodeResponse
        {
            InviteCode = org.InviteCode,
            InviteLink = _inviteLinks.BuildJoinLink(org.InviteCode)
        });
    }

    public async Task<ServiceResponse<PagedResponse<OrganizationMemberDto>>> GetMembersAsync(
        PagedRequest request, string? q, Guid? roleId)
    {
        var orgId = _userContext.OrganizationId;
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 100);
        var lowered = string.IsNullOrWhiteSpace(q) ? null : q.Trim().ToLowerInvariant();

        var roleQuery = _uow.Repository<Role>().GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(r => !r.IsDeleted);

        var query =
            from m in _uow.Repository<OrganizationMember>().GetQueryable().AsNoTracking()
            join u in _uow.Repository<User>().GetQueryable().AsNoTracking() on m.UserId equals u.Id
            join r in roleQuery on m.RoleId equals r.Id
            where m.OrganizationId == orgId
                  && r.Name != RoleNames.Admin
                  && r.Name != "SuperAdmin"
            select new { Member = m, User = u, Role = r };

        if (roleId.HasValue)
            query = query.Where(x => x.Member.RoleId == roleId.Value);

        if (!string.IsNullOrWhiteSpace(lowered))
        {
            query = query.Where(x =>
                (x.User.FirstName ?? string.Empty).ToLower().Contains(lowered) ||
                (x.User.LastName ?? string.Empty).ToLower().Contains(lowered) ||
                (x.User.Email ?? string.Empty).ToLower().Contains(lowered) ||
                x.Role.Name.ToLower().Contains(lowered));
        }

        var total = await query.CountAsync();
        var rows = await query
            .OrderBy(x => x.User.LastName)
            .ThenBy(x => x.User.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResponse<OrganizationMemberDto>
        {
            Items = rows.Select(r => MapMemberDto(r.Member, r.User, r.Role)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<int>> InviteMembersAsync(InviteMembersRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var org = await LoadCurrentOrganizationAsync();
        if (org == null)
            return Fail<int>(ErrorCodes.NotFound, "Organization not found.");

        var roles = (await _uow.Repository<Role>().FindAsync(r => r.OrganizationId == orgId)).ToList();
        var roleByName = roles.ToDictionary(r => r.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var item in request.Members)
        {
            if (item.RoleName.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase)
                || item.RoleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
                return Fail<int>(ErrorCodes.InvalidInput, $"Role '{item.RoleName}' cannot be assigned via invite.");

            if (!roleByName.ContainsKey(item.RoleName))
                return Fail<int>(ErrorCodes.InvalidInput, $"Role '{item.RoleName}' does not exist.");
        }

        var emails = request.Members.Select(m => m.Email.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var existingUsers = (await _uow.Repository<User>().FindAsync(u => emails.Contains(u.Email)))
            .ToDictionary(u => u.Email, StringComparer.OrdinalIgnoreCase);

        var existingMembers = (await _uow.Repository<OrganizationMember>()
                .FindAsync(m => m.OrganizationId == orgId))
            .Select(m => m.UserId)
            .ToHashSet();

        var inviteLink = _inviteLinks.BuildJoinLink(org.InviteCode);
        var invitedCount = 0;
        var emailFailures = 0;

        foreach (var item in request.Members)
        {
            var email = item.Email.Trim();
            var role = roleByName[item.RoleName];
            string? setupToken = null;

            if (!existingUsers.TryGetValue(email, out var user))
            {
                setupToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
                var emailLocal = email.Split('@')[0];
                user = new User
                {
                    FirstName = string.IsNullOrWhiteSpace(item.FirstName) ? emailLocal : item.FirstName.Trim(),
                    LastName = string.IsNullOrWhiteSpace(item.LastName) ? "Member" : item.LastName.Trim(),
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Welcome123!"),
                    PasswordResetToken = setupToken,
                    PasswordResetTokenExpires = DateTime.UtcNow.AddDays(7)
                };
                await _uow.Repository<User>().AddAsync(user);
                await _uow.CompleteAsync();
                existingUsers[email] = user;
            }

            if (existingMembers.Contains(user.Id))
            {
                var pendingMember = (await _uow.Repository<OrganizationMember>()
                        .FindAsync(m => m.OrganizationId == orgId && m.UserId == user.Id))
                    .FirstOrDefault();

                if (pendingMember?.IsActive == true)
                    continue;

                if (pendingMember != null && !pendingMember.IsActive)
                {
                    var needsPasswordSetup = !string.IsNullOrEmpty(user.PasswordResetToken);
                    if (needsPasswordSetup)
                    {
                        setupToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
                        user.PasswordResetToken = setupToken;
                        user.PasswordResetTokenExpires = DateTime.UtcNow.AddDays(7);
                        _uow.Repository<User>().Update(user);
                    }

                    var resendResult = await _emailService.SendInvitationEmailAsync(
                        user.Email, user.FirstName, org.Name, inviteLink, org.InviteCode, setupToken);

                    if (!resendResult.IsSuccess)
                        emailFailures++;
                    else
                        invitedCount++;

                    continue;
                }

                continue;
            }

            await _uow.Repository<OrganizationMember>().AddAsync(new OrganizationMember
            {
                OrganizationId = orgId,
                UserId = user.Id,
                RoleId = role.Id,
                IsActive = false,
                RequiresAdminApproval = false
            });
            existingMembers.Add(user.Id);
            invitedCount++;

            var emailResult = await _emailService.SendInvitationEmailAsync(
                user.Email, user.FirstName, org.Name, inviteLink, org.InviteCode, setupToken);

            if (!emailResult.IsSuccess)
            {
                emailFailures++;
                _logger.LogWarning(
                    "Invite email failed for {Email}: {Message}",
                    user.Email,
                    emailResult.Error?.Message ?? "Unknown error");
            }
        }

        if (emailFailures > 0 && invitedCount > 0)
        {
            return Fail<int>(
                ErrorCodes.OperationFailed,
                invitedCount == emailFailures
                    ? "Members were added but invitation emails could not be sent. Check API logs and Brevo sender settings."
                    : $"Added {invitedCount} member(s), but {emailFailures} invitation email(s) failed to send.");
        }

        if (invitedCount > 0 && org.OnboardingStep < 1)
            org.OnboardingStep = 1;

        await _uow.CompleteAsync();
        await _permissionCacheInvalidator.InvalidateOrganizationAsync(orgId);

        if (invitedCount > 0)
        {
            await _auditLogService.RecordAsync(
                orgId,
                _userContext.UserId,
                "members.invite",
                $"Invited {invitedCount} member(s)");
        }

        return Ok(invitedCount);
    }

    public async Task<ServiceResponse<OrganizationMemberDto>> UpdateMemberAsync(
        Guid userId, UpdateOrganizationMemberRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var member = (await _uow.Repository<OrganizationMember>()
                .FindAsync(m => m.OrganizationId == orgId && m.UserId == userId))
            .FirstOrDefault();

        if (member == null)
            return Fail<OrganizationMemberDto>(ErrorCodes.NotFound, "Member not found.");

        var memberRole = await GetRoleByIdCrossOrgAsync(member.RoleId);
        if (memberRole != null && IsProtectedMemberRole(memberRole.Name))
            return Fail<OrganizationMemberDto>(ErrorCodes.Forbidden, "Organization admins cannot be modified from this screen.");

        if (request.RoleId.HasValue)
        {
            var role = await _uow.Repository<Role>().GetByIdAsync(request.RoleId.Value);
            if (role == null || role.OrganizationId != orgId)
                return Fail<OrganizationMemberDto>(ErrorCodes.InvalidInput, "Invalid role.");
            if (role.Name.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase)
                || role.Name.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
                return Fail<OrganizationMemberDto>(ErrorCodes.InvalidInput, "The Admin role cannot be assigned from this screen.");
            member.RoleId = role.Id;
        }

        if (request.IsActive.HasValue)
        {
            if (request.IsActive.Value && member.RequiresAdminApproval)
                member.RequiresAdminApproval = false;
            member.IsActive = request.IsActive.Value;
        }

        _uow.Repository<OrganizationMember>().Update(member);
        await _uow.CompleteAsync();
        await _permissionCacheInvalidator.InvalidateOrganizationAsync(orgId);

        await _auditLogService.RecordAsync(
            orgId,
            _userContext.UserId,
            "member.update",
            $"Updated member {userId}",
            entityType: "OrganizationMember",
            entityId: userId);

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        var roleEntity = await _uow.Repository<Role>().GetByIdAsync(member.RoleId);
        if (user == null || roleEntity == null)
            return Fail<OrganizationMemberDto>(ErrorCodes.NotFound, "Member not found.");

        return Ok(MapMemberDto(member, user, roleEntity));
    }

    public async Task<ServiceResponse<bool>> DeleteMemberAsync(Guid userId)
    {
        var orgId = _userContext.OrganizationId;

        if (userId == _userContext.UserId)
            return Fail<bool>(ErrorCodes.Forbidden, "You cannot remove yourself from the organization.");

        var member = (await _uow.Repository<OrganizationMember>()
                .FindAsync(m => m.OrganizationId == orgId && m.UserId == userId))
            .FirstOrDefault();

        if (member == null)
            return Fail<bool>(ErrorCodes.NotFound, "Member not found.");

        var role = await GetRoleByIdCrossOrgAsync(member.RoleId);
        if (role != null && IsProtectedMemberRole(role.Name))
            return Fail<bool>(ErrorCodes.Forbidden, "Organization admins cannot be removed from this screen.");

        var groupIds = await _uow.Repository<Group>().GetQueryable()
            .AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted)
            .Select(g => g.Id)
            .ToListAsync();

        if (groupIds.Count > 0)
        {
            var groupMemberships = await _uow.Repository<GroupMember>().GetQueryable()
                .Where(gm => gm.UserId == userId && groupIds.Contains(gm.GroupId))
                .ToListAsync();

            foreach (var gm in groupMemberships)
                _uow.Repository<GroupMember>().Remove(gm);
        }

        _uow.Repository<OrganizationMember>().Remove(member);
        await _uow.CompleteAsync();
        await _permissionCacheInvalidator.InvalidateOrganizationAsync(orgId);

        await _auditLogService.RecordAsync(
            orgId,
            _userContext.UserId,
            "member.delete",
            $"Removed member {userId}",
            entityType: "OrganizationMember",
            entityId: userId);

        return Ok(true);
    }

    public async Task<ServiceResponse<IEnumerable<OrganizationRoleDto>>> GetRolesAsync()
    {
        var orgId = _userContext.OrganizationId;
        var roles = await _uow.Repository<Role>().GetQueryable()
            .AsNoTracking()
            .Where(r => r.OrganizationId == orgId && !r.IsDeleted)
            .Include(r => r.Permissions)
            .Include(r => r.Members)
            .OrderBy(r => r.Name)
            .ToListAsync();

        return Ok(roles.Select(MapRoleSummary));
    }

    public async Task<ServiceResponse<OrganizationRoleDetailDto>> GetRoleDetailAsync(Guid roleId)
    {
        var orgId = _userContext.OrganizationId;
        var role = await _uow.Repository<Role>().GetQueryable()
            .AsNoTracking()
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == roleId && r.OrganizationId == orgId && !r.IsDeleted);

        if (role == null)
            return Fail<OrganizationRoleDetailDto>(ErrorCodes.NotFound, "Role not found.");

        return Ok(MapRoleDetail(role));
    }

    public async Task<ServiceResponse<OrganizationRoleDto>> CreateRoleAsync(CreateOrganizationRoleRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var name = request.Name.Trim();
        var exists = await _uow.Repository<Role>().GetQueryable()
            .AnyAsync(r => r.OrganizationId == orgId && r.Name == name && !r.IsDeleted);
        if (exists)
            return Fail<OrganizationRoleDto>(ErrorCodes.InvalidInput, "A role with this name already exists.");

        var role = new Role { OrganizationId = orgId, Name = name };
        await _uow.Repository<Role>().AddAsync(role);
        await _uow.CompleteAsync();

        return Ok(new OrganizationRoleDto
        {
            Id = role.Id,
            Name = role.Name,
            MemberCount = 0,
            PermissionCount = 0
        });
    }

    public async Task<ServiceResponse<OrganizationRoleDto>> UpdateRoleAsync(
        Guid roleId, UpdateOrganizationRoleRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var role = await _uow.Repository<Role>().GetQueryable()
            .Include(r => r.Permissions)
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Id == roleId && r.OrganizationId == orgId && !r.IsDeleted);

        if (role == null)
            return Fail<OrganizationRoleDto>(ErrorCodes.NotFound, "Role not found.");

        if (role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !request.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return Fail<OrganizationRoleDto>(ErrorCodes.Forbidden, "The Admin role cannot be renamed.");

        role.Name = request.Name.Trim();
        _uow.Repository<Role>().Update(role);
        await _uow.CompleteAsync();

        return Ok(MapRoleSummary(role));
    }

    public async Task<ServiceResponse<bool>> DeleteRoleAsync(Guid roleId)
    {
        var orgId = _userContext.OrganizationId;
        var role = await _uow.Repository<Role>().GetQueryable()
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Id == roleId && r.OrganizationId == orgId && !r.IsDeleted);

        if (role == null)
            return Fail<bool>(ErrorCodes.NotFound, "Role not found.");

        if (role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return Fail<bool>(ErrorCodes.Forbidden, "The Admin role cannot be deleted.");

        if (role.Members.Any())
            return Fail<bool>(ErrorCodes.InvalidInput, "Remove all members from this role before deleting it.");

        _uow.Repository<Role>().Remove(role);
        await _uow.CompleteAsync();
        await _permissionCacheInvalidator.InvalidateOrganizationAsync(orgId);

        await _auditLogService.RecordAsync(
            orgId,
            _userContext.UserId,
            "role.delete",
            $"Deleted role {role.Name}",
            entityType: "Role",
            entityId: roleId);

        return Ok(true);
    }

    public async Task<ServiceResponse<OrganizationRoleDetailDto>> UpdateRolePermissionsAsync(
        Guid roleId, UpdateRolePermissionsRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var role = await _uow.Repository<Role>().GetQueryable()
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == roleId && r.OrganizationId == orgId && !r.IsDeleted);

        if (role == null)
            return Fail<OrganizationRoleDetailDto>(ErrorCodes.NotFound, "Role not found.");

        var validKeys = WidgetRegistry.AvailableWidgets
            .Where(w => !w.IsCoreFeature)
            .Select(w => w.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var org = await LoadCurrentOrganizationAsync();
        if (org == null)
            return Fail<OrganizationRoleDetailDto>(ErrorCodes.NotFound, "Organization not found.");

        var enabledKeys = OrganizationWidgetKeys.GetEffectiveEnabledKeys(org);

        role.Permissions.Clear();
        foreach (var perm in request.Permissions.DistinctBy(p => p.WidgetKey, StringComparer.OrdinalIgnoreCase))
        {
            if (!validKeys.Contains(perm.WidgetKey) || !enabledKeys.Contains(perm.WidgetKey))
                continue;
            if (!Enum.TryParse<AccessLevel>(perm.AccessLevel, true, out var level))
                continue;

            role.Permissions.Add(new RolePermission { WidgetKey = perm.WidgetKey, AccessLevel = level });
        }

        ApplyAdminSafetyNet(role);

        if (org.OnboardingStep < 2)
            org.OnboardingStep = 2;

        _uow.Repository<Role>().Update(role);
        _uow.Repository<Organization>().Update(org);
        await _uow.CompleteAsync();
        await _permissionCacheInvalidator.InvalidateOrganizationAsync(orgId);

        await _auditLogService.RecordAsync(
            orgId,
            _userContext.UserId,
            "role.permissions.update",
            $"Updated permissions for role {role.Name}",
            entityType: "Role",
            entityId: roleId);

        return Ok(MapRoleDetail(role));
    }

    public async Task<ServiceResponse<IEnumerable<WidgetCatalogItemDto>>> GetWidgetCatalogAsync()
    {
        var org = await LoadCurrentOrganizationAsync();
        var enabledKeys = org == null
            ? OrganizationWidgetKeys.GetConfigurableKeys()
            : OrganizationWidgetKeys.GetEffectiveEnabledKeys(org);

        var items = WidgetRegistry.AvailableWidgets
            .Where(w => !w.IsCoreFeature)
            .Select(w => new WidgetCatalogItemDto
            {
                Key = w.Key,
                Name = w.Name,
                Description = w.Description,
                Icon = w.Icon,
                DefaultAccessLevel = w.DefaultAccessLevel.ToString().ToLowerInvariant(),
                IsCoreFeature = w.IsCoreFeature,
                IsEnabledForOrganization = enabledKeys.Contains(w.Key)
            })
            .ToList();

        return Ok<IEnumerable<WidgetCatalogItemDto>>(items);
    }

    public async Task<ServiceResponse<OrganizationDetailsDto>> UpdateEnabledWidgetsAsync(
        UpdateOrganizationEnabledWidgetsRequest request)
    {
        var org = await LoadCurrentOrganizationAsync();
        if (org == null)
            return Fail<OrganizationDetailsDto>(ErrorCodes.NotFound, "Organization not found.");

        var configurable = OrganizationWidgetKeys.GetConfigurableKeys();
        var requested = request.EnabledWidgetKeys
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .Where(configurable.Contains)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requested.Count == 0)
            return Fail<OrganizationDetailsDto>(ErrorCodes.InvalidInput, "At least one widget must remain enabled.");

        org.EnabledWidgetKeysJson = OrganizationWidgetKeys.SerializeStoredKeys(requested);
        if (org.OnboardingStep < 9)
            org.OnboardingStep = 9;

        _uow.Repository<Organization>().Update(org);
        await _uow.CompleteAsync();
        await _permissionCacheInvalidator.InvalidateOrganizationAsync(OrgId);

        await _auditLogService.RecordAsync(
            OrgId,
            _userContext.UserId,
            "org.widgets.update",
            $"Updated enabled widgets ({requested.Count} active)");

        return Ok(await MapOrganizationDetailsAsync(org));
    }

    public Task<ServiceResponse<PagedResponse<AuditLogDto>>> GetAuditLogsAsync(PagedRequest request) =>
        _auditLogService.GetForCurrentOrganizationAsync(request);

    public async Task<ServiceResponse<IEnumerable<OrganizationPeriodDto>>> GetPeriodsAsync()
    {
        var periods = await _uow.Repository<OrganizationPeriod>()
            .GetQueryable()
            .AsNoTracking()
            .Where(p => p.OrganizationId == OrgId && !p.IsDeleted)
            .OrderByDescending(p => p.StartDate)
            .Select(p => MapPeriod(p))
            .ToListAsync();

        return Ok<IEnumerable<OrganizationPeriodDto>>(periods);
    }

    public async Task<ServiceResponse<OrganizationPeriodDto>> CreatePeriodAsync(CreateOrganizationPeriodRequest request)
    {
        if (request.IsCurrent)
            await ClearCurrentPeriodFlagAsync();

        var entity = new OrganizationPeriod
        {
            OrganizationId = OrgId,
            Name = request.Name.Trim(),
            StartDate = request.StartDate.Date,
            EndDate = request.EndDate.Date,
            IsCurrent = request.IsCurrent
        };

        await _uow.Repository<OrganizationPeriod>().AddAsync(entity);
        await _uow.CompleteAsync();
        return Ok(MapPeriod(entity));
    }

    public async Task<ServiceResponse<OrganizationPeriodDto>> UpdatePeriodAsync(
        Guid periodId,
        UpdateOrganizationPeriodRequest request)
    {
        var entity = await _uow.Repository<OrganizationPeriod>().GetByIdAsync(periodId);
        if (entity == null || entity.OrganizationId != OrgId)
            return Fail<OrganizationPeriodDto>(ErrorCodes.NotFound, "Period not found.");

        if (request.IsCurrent && !entity.IsCurrent)
            await ClearCurrentPeriodFlagAsync(exceptPeriodId: periodId);

        entity.Name = request.Name.Trim();
        entity.StartDate = request.StartDate.Date;
        entity.EndDate = request.EndDate.Date;
        entity.IsCurrent = request.IsCurrent;
        entity.UpdatedAt = DateTime.UtcNow;

        _uow.Repository<OrganizationPeriod>().Update(entity);
        await _uow.CompleteAsync();
        return Ok(MapPeriod(entity));
    }

    public async Task<ServiceResponse<bool>> DeletePeriodAsync(Guid periodId)
    {
        var entity = await _uow.Repository<OrganizationPeriod>().GetByIdAsync(periodId);
        if (entity == null || entity.OrganizationId != OrgId)
            return Fail<bool>(ErrorCodes.NotFound, "Period not found.");

        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        _uow.Repository<OrganizationPeriod>().Update(entity);
        await _uow.CompleteAsync();
        return Ok(true);
    }

    private async Task ClearCurrentPeriodFlagAsync(Guid? exceptPeriodId = null)
    {
        var current = await _uow.Repository<OrganizationPeriod>()
            .FindAsync(p => p.OrganizationId == OrgId && p.IsCurrent && !p.IsDeleted);

        foreach (var period in current)
        {
            if (exceptPeriodId.HasValue && period.Id == exceptPeriodId.Value)
                continue;

            period.IsCurrent = false;
            period.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<OrganizationPeriod>().Update(period);
        }
    }

    private static OrganizationPeriodDto MapPeriod(OrganizationPeriod p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        StartDate = p.StartDate,
        EndDate = p.EndDate,
        IsCurrent = p.IsCurrent
    };

    private Guid OrgId => _userContext.OrganizationId;

    private async Task<Organization?> LoadCurrentOrganizationAsync()
    {
        return await _uow.Repository<Organization>().GetQueryable()
            .Include(o => o.Roles).ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(o => o.Id == OrgId && !o.IsDeleted);
    }

    private Task<OrganizationDetailsDto> MapOrganizationDetailsAsync(Organization org)
    {
        var roles = org.Roles.Where(r => !r.IsDeleted).ToList();
        var permissions = roles.SelectMany(r => r.Permissions).ToList();
        var widgetKeys = OrganizationWidgetKeys.FilterWidgetKeys(
            org,
            permissions.Select(p => p.WidgetKey).Distinct()).ToList();
        var roleMappings = OrganizationWidgetKeys.FilterRoleWidgetMappings(
            org,
            roles.ToDictionary(
                r => r.Name,
                r => r.Permissions.Select(p => p.WidgetKey).ToList()));

        var dto = new OrganizationDetailsDto
        {
            Id = org.Id,
            OrganizationType = org.OrganizationType,
            Name = org.Name,
            ShortName = org.ShortName ?? string.Empty,
            EmailDomain = org.EmailDomain,
            PrimaryColor = org.PrimaryColor,
            SecondaryColor = org.SecondaryColor,
            TertiaryColor = org.TertiaryColor,
            LogoUrl = _mediaUrls.ToPublicUrl(org.LogoUrl),
            Roles = roles.Select(r => r.Name),
            Widgets = widgetKeys,
            RoleWidgetMappings = roleMappings,
            InviteCode = org.InviteCode,
            InviteLink = _inviteLinks.BuildJoinLink(org.InviteCode),
            OnboardingStep = org.OnboardingStep,
            IsActive = org.IsActive,
            EnabledWidgets = OrganizationWidgetKeys.GetEffectiveEnabledKeys(org).OrderBy(k => k).ToList()
        };

        return Task.FromResult(dto);
    }

    private OrganizationMemberDto MapMemberDto(OrganizationMember member, User user, Role role) =>
        new()
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            RoleId = role.Id,
            RoleName = role.Name,
            IsActive = member.IsActive,
            RequiresAdminApproval = member.RequiresAdminApproval,
            JoinedAt = member.JoinedAt,
            AvatarUrl = _mediaUrls.ToPublicUrl(user.AvatarUrl)
        };

    private static OrganizationRoleDto MapRoleSummary(Role role) =>
        new()
        {
            Id = role.Id,
            Name = role.Name,
            MemberCount = role.Members?.Count ?? 0,
            PermissionCount = role.Permissions?.Count ?? 0
        };

    private static OrganizationRoleDetailDto MapRoleDetail(Role role) =>
        new()
        {
            Id = role.Id,
            Name = role.Name,
            Permissions = role.Permissions
                .Select(p => new WidgetPermissionDto
                {
                    WidgetKey = p.WidgetKey,
                    AccessLevel = p.AccessLevel.ToString().ToLowerInvariant()
                })
                .OrderBy(p => p.WidgetKey)
                .ToList()
        };

    private static void ApplyAdminSafetyNet(Role role)
    {
        if (!role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return;

        var critical = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Users, AccessLevel.Admin },
            { WidgetKeys.Settings, AccessLevel.Admin },
            { WidgetKeys.News, AccessLevel.Admin },
            { WidgetKeys.Schedule, AccessLevel.View },
            { WidgetKeys.Admin, AccessLevel.Admin }
        };

        foreach (var (key, level) in critical)
        {
            var existing = role.Permissions.FirstOrDefault(p =>
                p.WidgetKey.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (existing == null)
                role.Permissions.Add(new RolePermission { WidgetKey = key, AccessLevel = level });
            else if (existing.AccessLevel < level)
                existing.AccessLevel = level;
        }
    }

    private Task<Role?> GetRoleByIdCrossOrgAsync(Guid roleId) =>
        _uow.Repository<Role>().GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roleId && !r.IsDeleted);

    private static bool IsProtectedMemberRole(string roleName) =>
        roleName.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase)
        || roleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase);

    private static ServiceResponse<T> Ok<T>(T data) => new(true, data);
    private static ServiceResponse<T> Fail<T>(string code, string message) =>
        new(false, default, new AppError(code, message));
}
