using System.Security.Claims;
using Omada.Api.Abstractions;

namespace Omada.Api.Infrastructure.Security;

public class HttpTenantAccessor : ITenantAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpTenantAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? CurrentOrganizationId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true)
                return null;

            var claim = user.FindFirst("OrganizationId")?.Value
                ?? user.FindFirst("organizationId")?.Value
                ?? user.FindFirst("orgId")?.Value;

            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}
