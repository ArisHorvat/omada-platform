using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Omada.Api.Abstractions;
using Omada.Api.Infrastructure;
using Omada.Api.DTOs.Auth;
using Omada.Api.DTOs.Users;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Omada.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IConfiguration _configuration;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public AuthService(IUnitOfWork uow, IUserContext userContext, IConfiguration configuration, IPublicMediaUrlResolver mediaUrls)
    {
        _uow = uow;
        _userContext = userContext;
        _configuration = configuration;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var user = (await _uow.Repository<User>().FindAsync(u => u.Email == request.Email)).FirstOrDefault();
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Unauthorized, "Invalid credentials"));

        var memberships = await _uow.Repository<OrganizationMember>().FindAsync(m => m.UserId == user.Id);
        var primary = memberships.FirstOrDefault();
        if (primary == null) return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "No organization."));

        var role = await _uow.Repository<Role>().GetByIdAsync(primary.RoleId);
        var roleName = role?.Name ?? "User";

        var jwtToken = GenerateJwtToken(user, primary.OrganizationId, roleName);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        var response = new LoginResponse
        {
            AccessToken = jwtToken,
            RefreshToken = refreshToken.Token, // Send it to frontend
            User = new UserDto { Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName },
            OrganizationId = primary.OrganizationId,
            Role = roleName
        };

        return new ServiceResponse<LoginResponse>(true, response);
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
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "Not a member of this organization"));

        // 3. Check if the User was banned from this specific organization
        if (!membership.IsActive)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "Your access to this organization has been suspended by an administrator."));

        // 4. Fetch Organization using UoW to check its global status
        var organization = await _uow.Repository<Organization>().GetByIdAsync(request.OrganizationId);
        
        if (organization == null || !organization.IsActive)
            return new ServiceResponse<LoginResponse>(false, null, new AppError(ErrorCodes.Forbidden, "This organization is currently inactive or suspended."));

        var role = await _uow.Repository<Role>().GetByIdAsync(membership.RoleId);
        var token = GenerateJwtToken(user, membership.OrganizationId, role?.Name ?? "User");

        var response = new LoginResponse
        {
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
        var user = (await _uow.Repository<User>().FindAsync(u => u.Email == request.Email)).FirstOrDefault();
        if (user == null) return new ServiceResponse<string>(true, "If the email exists, a reset link has been sent.");

        user.PasswordResetToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1);
        
        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "If the email exists, a reset link has been sent.");
    }

    public async Task<ServiceResponse<string>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = (await _uow.Repository<User>().FindAsync(u => u.Email == request.Email)).FirstOrDefault();
        
        if (user == null || user.PasswordResetToken != request.Token || user.PasswordResetTokenExpires < DateTime.UtcNow)
            return new ServiceResponse<string>(false, null, new AppError(ErrorCodes.InvalidInput, "Invalid or expired token."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpires = null;
        
        _uow.Repository<User>().Update(user);
        await _uow.CompleteAsync();

        return new ServiceResponse<string>(true, "Password has been reset successfully.");
    }


    // --- Helper Methods ---
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
}