using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Omada.Api.Abstractions;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.DTOs.Auth;
using Omada.Api.DTOs.Organizations;
using Omada.Api.DTOs.Users;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Omada.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IConfiguration _configuration;
    private readonly IPublicMediaUrlResolver _mediaUrls;
    private readonly IEmailService _emailService;
    private readonly IInviteLinkBuilder _inviteLinks;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        IUnitOfWork uow,
        IUserContext userContext,
        IConfiguration configuration,
        IPublicMediaUrlResolver mediaUrls,
        IEmailService emailService,
        IInviteLinkBuilder inviteLinks,
        IHttpContextAccessor httpContextAccessor)
    {
        _uow = uow;
        _userContext = userContext;
        _configuration = configuration;
        _mediaUrls = mediaUrls;
        _emailService = emailService;
        _inviteLinks = inviteLinks;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ServiceResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var user = await FindUserByEmailAsync(request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Unauthorized, "Invalid email or password."));

        var membership = await ResolvePrimaryMembershipAsync(user);
        if (!membership.IsSuccess || membership.Data == null)
            return new ServiceResponse<LoginResponse>(false, null, membership.Error ?? new AppError(ErrorCodes.Forbidden, "No organization."));

        if (user.IsTwoFactorEnabled)
            return await BeginTwoFactorLoginAsync(user);

        return await IssueLoginResponseAsync(user, membership.Data.OrganizationId, membership.Data.RoleName);
    }

    public async Task<ServiceResponse<LoginResponse>> VerifyTwoFactorAsync(VerifyTwoFactorRequest request)
    {
        var sessionToken = request.TwoFactorSessionToken.Trim();
        var user = (await _uow.Repository<User>().FindAsync(u => u.TwoFactorPendingSessionToken == sessionToken)).FirstOrDefault();

        if (user == null || !user.IsTwoFactorEnabled)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.InvalidInput, "This sign-in session expired. Sign in again."));

        if (user.TwoFactorCodeExpires == null || user.TwoFactorCodeExpires < DateTime.UtcNow)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.InvalidInput, "This code expired. Request a new one."));

        if (!IsValidTwoFactorCode(user.TwoFactorCode, request.Code))
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.InvalidInput, "Invalid verification code."));

        ClearTwoFactorPendingFields(user);
        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        var membership = await ResolvePrimaryMembershipAsync(user);
        if (!membership.IsSuccess || membership.Data == null)
            return new ServiceResponse<LoginResponse>(false, null, membership.Error ?? new AppError(ErrorCodes.Forbidden, "No organization."));

        return await IssueLoginResponseAsync(user, membership.Data.OrganizationId, membership.Data.RoleName);
    }

    public async Task<ServiceResponse<string>> ResendTwoFactorCodeAsync(ResendTwoFactorRequest request)
    {
        var sessionToken = request.TwoFactorSessionToken.Trim();
        var user = (await _uow.Repository<User>().FindAsync(u => u.TwoFactorPendingSessionToken == sessionToken)).FirstOrDefault();

        if (user == null || !user.IsTwoFactorEnabled)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.InvalidInput, "This sign-in session expired. Sign in again."));

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        user.TwoFactorCode = code;
        user.TwoFactorCodeExpires = DateTime.UtcNow.AddMinutes(TwoFactorConstants.CodeLifetimeMinutes);

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        _ = _emailService.SendTwoFactorCodeEmailAsync(user.Email, user.FirstName, code);

        return new ServiceResponse<string>(true, "A new verification code was sent to your email.");
    }

    public async Task<ServiceResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        // 1. Get user claims from expired JWT
        var principal = GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null) return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Unauthorized, "Invalid token"));

        var userId = Guid.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? principal.FindFirst("sub")?.Value!);
        var orgId = Guid.Parse(principal.FindFirst("OrganizationId")!.Value);
        var role = principal.FindFirst(ClaimTypes.Role)!.Value;

        // 2. Validate Refresh Token in DB
        var storedToken = (await _uow.Repository<RefreshToken>().FindAsync(t => t.Token == request.RefreshToken && t.UserId == userId)).FirstOrDefault();
        
        if (storedToken == null || !storedToken.IsActive)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Unauthorized, "Refresh token expired or revoked. Please login again."));

        // 3. Rotate Token (Revoke old, create new)
        storedToken.IsRevoked = true;
        _uow.Repository<RefreshToken>().Update(storedToken);

        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        var newJwt = GenerateJwtToken(user!, orgId, role);
        var newRefreshToken = await CreateRefreshTokenAsync(userId);

        return new ServiceResponse<LoginResponse>(true, new LoginResponse
        {
            RequiresTwoFactor = false,
            AccessToken = newJwt,
            RefreshToken = newRefreshToken.Token,
            OrganizationId = orgId,
            Role = role,
            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email
            }
        });
    }

    public async Task<ServiceResponse<List<UserOrganizationDto>>> GetMyOrganizationsAsync()
    {
        var userId = _userContext.UserId;
        var currentOrgId = _userContext.OrganizationId;

        var memberships = await _uow.Repository<OrganizationMember>().FindAsync(m => m.UserId == userId && m.IsActive);
        var result = new List<UserOrganizationDto>();

        foreach (var m in memberships)
        {
            var org = await _uow.Repository<Organization>().GetByIdAsync(m.OrganizationId);
            var role = await _uow.Repository<Role>().GetQueryable()
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == m.RoleId && !r.IsDeleted);

            if (org != null)
            {
                result.Add(new UserOrganizationDto
                {
                    OrganizationId = org.Id,
                    OrganizationType = org.OrganizationType,
                    OrganizationName = org.Name,
                    Role = role?.Name ?? "Member",
                    IsCurrent = org.Id == currentOrgId,
                    LogoUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(org.LogoUrl) ? null : org.LogoUrl)
                });
            }
        }

        return new ServiceResponse<List<UserOrganizationDto>>(true, result);
    }

    public async Task<ServiceResponse<LoginResponse>> SwitchOrganizationAsync(SwitchOrgRequest request)
    {
        var userId = _userContext.UserId;

        // 1. Fetch User
        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null) 
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        // 2. Fetch Membership using UoW
        var membership = (await _uow.Repository<OrganizationMember>()
            .FindAsync(m => m.UserId == userId && m.OrganizationId == request.OrganizationId)).FirstOrDefault();

        if (membership == null)
        {
            if (!IsCallerSuperAdmin())
                return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "Not a member of this organization"));

            var targetOrg = await _uow.Repository<Organization>().GetByIdAsync(request.OrganizationId);
            if (targetOrg == null || !targetOrg.IsActive)
                return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "This organization is currently inactive or suspended."));

            var superAdminToken = GenerateJwtToken(user, request.OrganizationId, "SuperAdmin");
            return new ServiceResponse<LoginResponse>(true, new LoginResponse
            {
                RequiresTwoFactor = false,
                AccessToken = superAdminToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                },
                OrganizationId = request.OrganizationId,
                Role = "SuperAdmin"
            });
        }

        // 3. Check if the User was banned from this specific organization
        if (!membership.IsActive)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "Your access to this organization has been suspended by an administrator."));

        // 4. Fetch Organization using UoW to check its global status
        var organization = await _uow.Repository<Organization>().GetByIdAsync(request.OrganizationId);
        
        if (organization == null || !organization.IsActive)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "This organization is currently inactive or suspended."));

        var role = await GetRoleByIdCrossOrgAsync(membership.RoleId);
        var token = GenerateJwtToken(user, membership.OrganizationId, role?.Name ?? "User");

        var response = new LoginResponse
        {
            RequiresTwoFactor = false,
            AccessToken = token,
            User = new UserDto 
            { 
                Id = user.Id, 
                Email = user.Email, 
                FirstName = user.FirstName, 
                LastName = user.LastName 
            },
            OrganizationId = membership.OrganizationId,
            Role = role?.Name ?? "User"
        };

        return new ServiceResponse<LoginResponse>(true, response);
    }

    public async Task<ServiceResponse<string>> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await FindUserByEmailAsync(request.Email);
        if (user == null)
            return new ServiceResponse<string>(true, "If the email exists, a reset link has been sent.");

        var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1);
        user.PasswordResetTokenPurpose = PasswordResetTokenPurposes.PasswordReset;

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        var resetLink = _inviteLinks.BuildPasswordResetLink(user.Email, token);
        _ = _emailService.SendPasswordResetEmailAsync(user.Email, user.FirstName, resetLink);

        return new ServiceResponse<string>(true, "If the email exists, a reset link has been sent.");
    }

    public async Task<ServiceResponse<string>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await FindUserByEmailAsync(request.Email);
        var token = request.Token.Trim();

        if (user == null || !IsValidPasswordResetToken(user, token))
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.InvalidInput, "Invalid or expired reset link. Request a new one from the sign-in screen."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpires = null;
        user.PasswordResetTokenPurpose = null;

        var refreshTokens = await _uow.Repository<RefreshToken>()
            .GetQueryable()
            .Where(t => t.UserId == user.Id)
            .ToListAsync();
        foreach (var refreshToken in refreshTokens)
            refreshToken.IsRevoked = true;

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Password has been reset successfully.");
    }

    private async Task<User?> FindUserByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return (await _uow.Repository<User>().FindAsync(u => u.Email.ToLower() == normalized)).FirstOrDefault();
    }

    private static bool IsValidPasswordResetToken(User user, string token)
    {
        if (string.IsNullOrWhiteSpace(user.PasswordResetToken)
            || user.PasswordResetTokenExpires == null
            || user.PasswordResetTokenExpires < DateTime.UtcNow)
            return false;

        if (string.Equals(user.PasswordResetTokenPurpose, PasswordResetTokenPurposes.InviteSetup, StringComparison.Ordinal))
            return false;

        if (!string.IsNullOrEmpty(user.PasswordResetTokenPurpose)
            && !string.Equals(user.PasswordResetTokenPurpose, PasswordResetTokenPurposes.PasswordReset, StringComparison.Ordinal))
            return false;

        return string.Equals(user.PasswordResetToken.Trim(), token, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<ServiceResponse<JoinOrganizationResultDto>> JoinOrganizationAsync(JoinOrganizationRequest request)
    {
        var normalizedCode = request.InviteCode.Trim().ToUpperInvariant();
        var org = (await _uow.Repository<Organization>().FindAsync(o =>
            o.InviteCode == normalizedCode && o.IsActive)).FirstOrDefault();

        if (org == null)
            return new ServiceResponse<JoinOrganizationResultDto>(false, null, new AppError(ErrorCodes.NotFound, "Invalid or expired invite code."));

        var roles = await GetRolesForOrganizationAsync(org.Id);
        var joinRole = ResolveJoinRole(roles);
        if (joinRole == null)
            return new ServiceResponse<JoinOrganizationResultDto>(false, null, new AppError(ErrorCodes.InvalidInput, "Organization has no roles configured."));

        var email = request.Email.Trim();
        var existingUser = (await _uow.Repository<User>().FindAsync(u =>
            u.Email.ToLower() == email.ToLower())).FirstOrDefault();

        if (existingUser != null)
        {
            var existingMembership = (await _uow.Repository<OrganizationMember>().FindAsync(m =>
                m.UserId == existingUser.Id && m.OrganizationId == org.Id)).FirstOrDefault();

            if (existingMembership?.IsActive == true)
                return new ServiceResponse<JoinOrganizationResultDto>(false, null, new AppError(ErrorCodes.InvalidInput, "You are already a member of this organization. Sign in instead."));

            if (existingMembership != null && !existingMembership.IsActive)
            {
                var hasIncompleteSetup = !string.IsNullOrEmpty(existingUser.PasswordResetToken)
                    && !string.Equals(existingUser.PasswordResetTokenPurpose, PasswordResetTokenPurposes.PasswordReset, StringComparison.Ordinal);
                if (hasIncompleteSetup)
                {
                    if (!string.IsNullOrWhiteSpace(request.SetupToken))
                    {
                        var tokenError = ValidateSetupToken(existingUser, request.SetupToken);
                        if (tokenError != null)
                            return new ServiceResponse<JoinOrganizationResultDto>(false, null, tokenError);
                    }
                }
                else
                {
                    return new ServiceResponse<JoinOrganizationResultDto>(false, null, new AppError(ErrorCodes.InvalidInput, "An account with this email already exists. Sign in to accept the invite."));
                }

                existingUser.FirstName = request.FirstName.Trim();
                existingUser.LastName = request.LastName.Trim();
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                existingUser.PasswordResetToken = null;
                existingUser.PasswordResetTokenExpires = null;
                existingUser.PasswordResetTokenPurpose = null;
                _uow.Repository<User>().Update(existingUser);

                existingMembership.IsActive = true;
                _uow.Repository<OrganizationMember>().Update(existingMembership);
                await _uow.CompleteAsync();

                _ = _emailService.SendJoinWelcomeEmailAsync(existingUser.Email, existingUser.FirstName, org.Name);
                return new ServiceResponse<JoinOrganizationResultDto>(true, new JoinOrganizationResultDto
                {
                    OrganizationName = org.Name,
                    Email = existingUser.Email
                });
            }

            return new ServiceResponse<JoinOrganizationResultDto>(false, null, new AppError(ErrorCodes.InvalidInput, "An account with this email already exists. Sign in to accept the invite."));
        }

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsTwoFactorEnabled = false
        };

        await _uow.Repository<User>().AddAsync(user);
        await _uow.Repository<OrganizationMember>().AddAsync(new OrganizationMember
        {
            OrganizationId = org.Id,
            User = user,
            RoleId = joinRole.Id,
            IsActive = true
        });
        await _uow.CompleteAsync();

        _ = _emailService.SendJoinWelcomeEmailAsync(user.Email, user.FirstName, org.Name);
        return new ServiceResponse<JoinOrganizationResultDto>(true, new JoinOrganizationResultDto
        {
            OrganizationName = org.Name,
            Email = user.Email
        });
    }

    public async Task<ServiceResponse<List<PendingOrganizationInviteDto>>> GetPendingInvitesAsync()
    {
        var userId = _userContext.UserId;
        var pending = await _uow.Repository<OrganizationMember>().GetQueryable()
            .AsNoTracking()
            .Where(m => m.UserId == userId && !m.IsActive && !m.RequiresAdminApproval)
            .Include(m => m.Organization)
            .Include(m => m.Role)
            .OrderByDescending(m => m.JoinedAt)
            .ToListAsync();

        var items = pending.Select(m => new PendingOrganizationInviteDto
        {
            OrganizationId = m.OrganizationId,
            OrganizationName = m.Organization.Name,
            LogoUrl = _mediaUrls.ToPublicUrl(m.Organization.LogoUrl),
            InviteCode = m.Organization.InviteCode,
            RoleName = m.Role.Name,
            InvitedAt = m.JoinedAt
        }).ToList();

        return new ServiceResponse<List<PendingOrganizationInviteDto>>(true, items);
    }

    public async Task<ServiceResponse<LoginResponse>> AcceptInviteAsync(InviteCodeRequest request)
    {
        var user = await _uow.Repository<User>().GetByIdAsync(_userContext.UserId);
        if (user == null)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Unauthorized, "User not found."));

        var orgResult = await ResolveOrganizationByInviteCodeAsync(request.InviteCode);
        if (!orgResult.IsSuccess || orgResult.Data == null)
            return new ServiceResponse<LoginResponse>(false, null, orgResult.Error ?? new AppError(ErrorCodes.NotFound, "Invalid invite."));

        var org = orgResult.Data;
        var membership = (await _uow.Repository<OrganizationMember>().FindAsync(m =>
            m.UserId == user.Id && m.OrganizationId == org.Id)).FirstOrDefault();

        if (membership == null)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.NotFound, "No pending invite found for this organization."));

        if (membership.RequiresAdminApproval)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "Your access request must be approved by an administrator."));

        if (membership.IsActive)
        {
            var activeRole = await GetRoleByIdCrossOrgAsync(membership.RoleId);
            return await IssueLoginResponseAsync(user, org.Id, activeRole?.Name ?? "Member");
        }

        membership.IsActive = true;
        _uow.Repository<OrganizationMember>().Update(membership);
        await _uow.CompleteAsync();

        var role = await GetRoleByIdCrossOrgAsync(membership.RoleId);
        var roleName = role?.Name ?? "Member";

        _ = _emailService.SendJoinWelcomeEmailAsync(user.Email, user.FirstName, org.Name);
        return await IssueLoginResponseAsync(user, org.Id, roleName);
    }

    public async Task<ServiceResponse<bool>> DeclineInviteAsync(InviteCodeRequest request)
    {
        var userId = _userContext.UserId;
        var orgResult = await ResolveOrganizationByInviteCodeAsync(request.InviteCode);
        if (!orgResult.IsSuccess || orgResult.Data == null)
            return new ServiceResponse<bool>(false, false, orgResult.Error);

        var org = orgResult.Data;
        var membership = (await _uow.Repository<OrganizationMember>().FindAsync(m =>
            m.UserId == userId && m.OrganizationId == org.Id && !m.IsActive)).FirstOrDefault();

        if (membership == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "No pending invite found for this organization."));

        _uow.Repository<OrganizationMember>().Remove(membership);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<OrganizationInvitePreviewDto>> GetInvitePreviewForCurrentUserAsync(string inviteCode)
    {
        var orgResult = await ResolveOrganizationByInviteCodeAsync(inviteCode);
        if (!orgResult.IsSuccess || orgResult.Data == null)
            return new ServiceResponse<OrganizationInvitePreviewDto>(false, null, orgResult.Error);

        var org = orgResult.Data;
        var user = await _uow.Repository<User>().GetByIdAsync(_userContext.UserId);
        if (user == null)
            return new ServiceResponse<OrganizationInvitePreviewDto>(false, null, new AppError(ErrorCodes.Unauthorized, "User not found."));

        var dto = new OrganizationInvitePreviewDto
        {
            OrganizationId = org.Id,
            Name = org.Name,
            LogoUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(org.LogoUrl) ? null : org.LogoUrl),
            InviteCode = org.InviteCode,
            InvitedEmail = user.Email,
            InvitedFirstName = user.FirstName,
            InvitedLastName = user.LastName,
            HasExistingAccount = true,
        };

        var membership = (await _uow.Repository<OrganizationMember>().FindAsync(m =>
            m.UserId == user.Id && m.OrganizationId == org.Id)).FirstOrDefault();

        if (membership?.IsActive == true)
        {
            dto.IsAlreadyMember = true;
        }
        else if (membership != null && !membership.IsActive && !membership.RequiresAdminApproval)
        {
            dto.HasPendingInvite = true;
            dto.RequiresSignIn = true;
        }

        return new ServiceResponse<OrganizationInvitePreviewDto>(true, dto);
    }

    public async Task<ServiceResponse<JoinWithCodeResultDto>> JoinWithInviteCodeAsync(JoinWithInviteCodeRequest request)
    {
        var user = await _uow.Repository<User>().GetByIdAsync(_userContext.UserId);
        if (user == null)
            return new ServiceResponse<JoinWithCodeResultDto>(false, null, new AppError(ErrorCodes.Unauthorized, "User not found."));

        var normalizedCode = request.InviteCode.Trim().ToUpperInvariant();
        var orgResult = await ResolveOrganizationByInviteCodeAsync(normalizedCode);
        if (!orgResult.IsSuccess || orgResult.Data == null)
            return new ServiceResponse<JoinWithCodeResultDto>(false, null, orgResult.Error);

        var org = orgResult.Data;
        var roles = await GetRolesForOrganizationAsync(org.Id);
        var joinRole = ResolveJoinRole(roles);
        if (joinRole == null)
            return new ServiceResponse<JoinWithCodeResultDto>(false, null, new AppError(ErrorCodes.InvalidInput, "Organization has no roles configured."));

        var existingMembership = (await _uow.Repository<OrganizationMember>().FindAsync(m =>
            m.UserId == user.Id && m.OrganizationId == org.Id)).FirstOrDefault();

        if (existingMembership != null)
        {
            if (existingMembership.IsActive)
            {
                var activeRole = await GetRoleByIdCrossOrgAsync(existingMembership.RoleId);
                var loginResult = await IssueLoginResponseAsync(user, org.Id, activeRole?.Name ?? joinRole.Name);
                if (!loginResult.IsSuccess)
                    return new ServiceResponse<JoinWithCodeResultDto>(false, null, loginResult.Error);

                return new ServiceResponse<JoinWithCodeResultDto>(true, new JoinWithCodeResultDto
                {
                    OrganizationName = org.Name,
                    Status = "Joined",
                    Session = loginResult.Data
                });
            }

            return new ServiceResponse<JoinWithCodeResultDto>(true, new JoinWithCodeResultDto
            {
                OrganizationName = org.Name,
                Status = "PendingApproval"
            });
        }

        await _uow.Repository<OrganizationMember>().AddAsync(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = user.Id,
            RoleId = joinRole.Id,
            IsActive = false,
            RequiresAdminApproval = true
        });
        await _uow.CompleteAsync();

        return new ServiceResponse<JoinWithCodeResultDto>(true, new JoinWithCodeResultDto
        {
            OrganizationName = org.Name,
            Status = "PendingApproval"
        });
    }


    // --- Helper Methods ---

    private static Role? ResolveJoinRole(List<Role> roles) => RoleResolution.ResolveJoinRole(roles);

    private Task<List<Role>> GetRolesForOrganizationAsync(Guid organizationId) =>
        _uow.Repository<Role>().GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(r => r.OrganizationId == organizationId && !r.IsDeleted)
            .ToListAsync();

    private Task<Role?> GetRoleByIdCrossOrgAsync(Guid roleId) =>
        _uow.Repository<Role>().GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roleId && !r.IsDeleted);

    private async Task<ServiceResponse<Organization>> ResolveOrganizationByInviteCodeAsync(string inviteCode)
    {
        var normalized = inviteCode.Trim().ToUpperInvariant();
        var org = (await _uow.Repository<Organization>().FindAsync(o =>
            o.InviteCode == normalized && o.IsActive)).FirstOrDefault();

        return org == null
            ? new ServiceResponse<Organization>(false, null, new AppError(ErrorCodes.NotFound, "Invalid or expired invite code."))
            : new ServiceResponse<Organization>(true, org);
    }

    private static AppError? ValidateSetupToken(User user, string? setupToken)
    {
        if (string.IsNullOrWhiteSpace(user.PasswordResetToken))
            return new AppError(ErrorCodes.InvalidInput, "Sign in to accept this invite.");

        if (string.Equals(user.PasswordResetTokenPurpose, PasswordResetTokenPurposes.PasswordReset, StringComparison.Ordinal))
            return new AppError(ErrorCodes.InvalidInput, "Use the complete link from your invite email to set your password.");

        if (string.IsNullOrWhiteSpace(setupToken)
            || !string.Equals(user.PasswordResetToken, setupToken.Trim(), StringComparison.OrdinalIgnoreCase))
            return new AppError(ErrorCodes.InvalidInput, "Use the complete link from your invite email to set your password.");

        if (user.PasswordResetTokenExpires.HasValue && user.PasswordResetTokenExpires.Value < DateTime.UtcNow)
            return new AppError(ErrorCodes.InvalidInput, "This invite link has expired. Ask your admin to resend the invite.");

        return null;
    }

    private async Task<ServiceResponse<LoginResponse>> IssueLoginResponseAsync(User user, Guid organizationId, string roleName)
    {
        var jwt = GenerateJwtToken(user, organizationId, roleName);
        var refresh = await CreateRefreshTokenAsync(user.Id);

        return new ServiceResponse<LoginResponse>(true, new LoginResponse
        {
            RequiresTwoFactor = false,
            AccessToken = jwt,
            RefreshToken = refresh.Token,
            OrganizationId = organizationId,
            Role = roleName,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            }
        });
    }

    private sealed class PrimaryMembership
    {
        public required Guid OrganizationId { get; init; }
        public required string RoleName { get; init; }
    }

    private async Task<ServiceResponse<PrimaryMembership>> ResolvePrimaryMembershipAsync(User user)
    {
        var memberships = await _uow.Repository<OrganizationMember>().FindAsync(m => m.UserId == user.Id && m.IsActive);
        var primary = memberships.FirstOrDefault();
        if (primary == null)
        {
            var pendingMemberships = (await _uow.Repository<OrganizationMember>()
                .FindAsync(m => m.UserId == user.Id && !m.IsActive)).ToList();
            if (pendingMemberships.Any())
                primary = pendingMemberships.OrderByDescending(m => m.JoinedAt).First();
            else
                return new ServiceResponse<PrimaryMembership>(false, null, new AppError(ErrorCodes.Forbidden, "No organization."));
        }

        var role = await _uow.Repository<Role>().GetByIdAsync(primary.RoleId);
        var roleName = role?.Name ?? "User";

        return new ServiceResponse<PrimaryMembership>(true, new PrimaryMembership
        {
            OrganizationId = primary.OrganizationId,
            RoleName = roleName
        });
    }

    private async Task<ServiceResponse<LoginResponse>> BeginTwoFactorLoginAsync(User user)
    {
        var sessionToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        user.TwoFactorPendingSessionToken = sessionToken;
        user.TwoFactorCode = code;
        user.TwoFactorCodeExpires = DateTime.UtcNow.AddMinutes(TwoFactorConstants.CodeLifetimeMinutes);

        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        _ = _emailService.SendTwoFactorCodeEmailAsync(user.Email, user.FirstName, code);

        return new ServiceResponse<LoginResponse>(true, new LoginResponse
        {
            RequiresTwoFactor = true,
            TwoFactorSessionToken = sessionToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            }
        });
    }

    private static void ClearTwoFactorPendingFields(User user)
    {
        user.TwoFactorPendingSessionToken = null;
        user.TwoFactorCode = null;
        user.TwoFactorCodeExpires = null;
    }

    private static bool IsValidTwoFactorCode(string? storedCode, string submittedCode)
    {
        if (string.IsNullOrWhiteSpace(storedCode))
            return false;

        var normalized = submittedCode.Trim();
        if (normalized.Length != TwoFactorConstants.CodeLength || !normalized.All(char.IsDigit))
            return false;

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(storedCode),
            Encoding.UTF8.GetBytes(normalized));
    }

    private string GenerateJwtToken(User user, Guid organizationId, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("OrganizationId", organizationId.ToString()),
            new Claim(ClaimTypes.Role, user.Email.Equals("me@admin.com", StringComparison.OrdinalIgnoreCase) ? "SuperAdmin" : role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        return tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(Guid userId)
    {
        var token = new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        await _uow.Repository<RefreshToken>().AddAsync(token);
        await _uow.CompleteAsync();
        return token;
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidIssuer = _configuration["Jwt:Issuer"],
            ValidAudience = _configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!)),
            ValidateLifetime = false // Here we intentionally ignore the expiration date!
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
        if (securityToken is not JwtSecurityToken jwtSecurityToken || 
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token");

        return principal;
    }

    private bool IsCallerSuperAdmin()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        return user?.IsInRole("SuperAdmin") == true || user?.IsInRole("Super Admin") == true;
    }
}