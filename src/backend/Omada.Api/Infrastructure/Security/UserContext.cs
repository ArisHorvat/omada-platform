using System.Security.Claims;
using Omada.Api.Abstractions;

namespace Omada.Api.Infrastructure.Security;

/// <summary>
/// Application-facing identity: always a valid <see cref="UserId"/> and <see cref="OrganizationId"/> for
/// <c>[Authorize]</c> flows. Throws if claims are missing—use <see cref="ITenantAccessor"/> when null is valid (EF seed, migrations).
/// </summary>
public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenantAccessor _tenantAccessor;

    public UserContext(IHttpContextAccessor httpContextAccessor, ITenantAccessor tenantAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenantAccessor = tenantAccessor;
    }

    public Guid UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userIdClaim = user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? user?.FindFirstValue("sub");

            if (Guid.TryParse(userIdClaim, out var userId))
                return userId;

            throw new UnauthorizedAccessException("User ID claim is missing or invalid in the current token.");
        }
    }

    /// <summary>
    /// Same organization as <see cref="ITenantAccessor.CurrentOrganizationId"/>, but never null—intended for authenticated API work.
    /// </summary>
    public Guid OrganizationId =>
        _tenantAccessor.CurrentOrganizationId
        ?? throw new UnauthorizedAccessException("Organization ID claim is missing or invalid in the current token.");
}
