using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.DigitalId;
using Omada.Api.DTOs.Users;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Options;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class DigitalIdService : IDigitalIdService
{
    private const string OrgClaimType = "org";
    private const string TokenUseClaim = "token_use";
    private const string TokenUseDigitalId = "digital_id";

    private readonly ApplicationDbContext _db;
    private readonly IUserContext _userContext;
    private readonly IConfiguration _configuration;
    private readonly DigitalIdOptions _options;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public DigitalIdService(
        ApplicationDbContext db,
        IUserContext userContext,
        IConfiguration configuration,
        IOptions<DigitalIdOptions> options,
        IPublicMediaUrlResolver mediaUrls)
    {
        _db = db;
        _userContext = userContext;
        _configuration = configuration;
        _options = options.Value;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<DigitalIdDto>> GetMyDigitalIdAsync(CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
            return new ServiceResponse<DigitalIdDto>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var member = await _db.OrganizationMembers
            .AsNoTracking()
            .Include(m => m.Role)
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.OrganizationId == orgId && m.IsActive, cancellationToken);

        if (member == null)
            return new ServiceResponse<DigitalIdDto>(false, null, new AppError(ErrorCodes.Forbidden, "Not a member of this organization."));

        var now = DateTime.UtcNow;
        var lifetime = TimeSpan.FromSeconds(Math.Clamp(_options.TokenLifetimeSeconds, 15, 300));
        var expires = now.Add(lifetime);

        var qrToken = CreateQrJwt(userId, orgId, now, expires);

        var dto = new DigitalIdDto
        {
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            RoleName = member.Role?.Name ?? "Member",
            OrganizationName = member.Organization?.Name ?? string.Empty,
            OrganizationId = orgId,
            AvatarUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(user.AvatarUrl) ? null : user.AvatarUrl),
            QrExpiresAtUtc = expires,
            QrToken = qrToken,
            BarcodeValue = BuildBarcodeValue(userId, orgId),
        };

        return new ServiceResponse<DigitalIdDto>(true, dto);
    }

    public Task<ServiceResponse<DigitalIdValidationResponse>> ValidateQrTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Task.FromResult(new ServiceResponse<DigitalIdValidationResponse>(true, new DigitalIdValidationResponse
            {
                Valid = false,
                Message = "Token is required.",
            }));
        }

        try
        {
            var principal = ValidateQrJwt(token, out var jwt);
            if (principal == null || jwt == null)
            {
                return Task.FromResult(new ServiceResponse<DigitalIdValidationResponse>(true, new DigitalIdValidationResponse
                {
                    Valid = false,
                    Message = "Invalid token.",
                }));
            }

            var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(sub, out var userId))
            {
                return Task.FromResult(new ServiceResponse<DigitalIdValidationResponse>(true, new DigitalIdValidationResponse
                {
                    Valid = false,
                    Message = "Invalid subject.",
                }));
            }

            var orgClaim = principal.FindFirst(OrgClaimType)?.Value;
            if (!Guid.TryParse(orgClaim, out var organizationId))
            {
                return Task.FromResult(new ServiceResponse<DigitalIdValidationResponse>(true, new DigitalIdValidationResponse
                {
                    Valid = false,
                    Message = "Invalid organization claim.",
                }));
            }

            var issued = jwt.ValidFrom;
            var exp = jwt.ValidTo;

            return Task.FromResult(new ServiceResponse<DigitalIdValidationResponse>(true, new DigitalIdValidationResponse
            {
                Valid = true,
                UserId = userId,
                OrganizationId = organizationId,
                IssuedAtUtc = issued.Kind == DateTimeKind.Utc ? issued : DateTime.SpecifyKind(issued, DateTimeKind.Utc),
                ExpiresAtUtc = exp.Kind == DateTimeKind.Utc ? exp : DateTime.SpecifyKind(exp, DateTimeKind.Utc),
                Message = "OK",
            }));
        }
        catch (SecurityTokenException ex)
        {
            return Task.FromResult(new ServiceResponse<DigitalIdValidationResponse>(true, new DigitalIdValidationResponse
            {
                Valid = false,
                Message = ex.Message,
            }));
        }
    }

    private string CreateQrJwt(Guid userId, Guid organizationId, DateTime notBefore, DateTime expires)
    {
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var issuer = _configuration["Jwt:Issuer"]!;
        var audience = _options.QrAudience;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(OrgClaimType, organizationId.ToString()),
            new Claim(TokenUseClaim, TokenUseDigitalId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature);
        var handler = new JwtSecurityTokenHandler();
        var jwt = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: notBefore,
            expires: expires,
            signingCredentials: creds);

        return handler.WriteToken(jwt);
    }

    private ClaimsPrincipal? ValidateQrJwt(string token, out JwtSecurityToken? jwt)
    {
        jwt = null;
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var issuer = _configuration["Jwt:Issuer"]!;
        var audience = _options.QrAudience;

        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(5),
        };

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(token, parameters, out var securityToken);

        if (securityToken is not JwtSecurityToken j)
            return null;

        jwt = j;
        if (!j.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
            return null;

        if (principal.FindFirst(TokenUseClaim)?.Value != TokenUseDigitalId)
            return null;

        return principal;
    }

    private static string BuildBarcodeValue(Guid userId, Guid organizationId)
    {
        var raw = $"{userId:N}{organizationId:N}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        ulong v = 0;
        for (var i = 0; i < 8; i++)
            v = (v << 8) | hash[i];

        return (v % 1_000_000_000_000UL).ToString("D12");
    }
}
