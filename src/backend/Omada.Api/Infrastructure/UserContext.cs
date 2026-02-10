using System.Security.Claims;

namespace Omada.Api.Infrastructure;

public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId => Guid.Parse(_httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) 
        ?? throw new UnauthorizedAccessException());

    public Guid OrganizationId => Guid.Parse(_httpContextAccessor.HttpContext?.User.FindFirstValue("OrganizationId") 
        ?? throw new UnauthorizedAccessException());
}