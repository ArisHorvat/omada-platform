using Microsoft.AspNetCore.Authorization;
using Omada.Api.Repositories.Interfaces;
using System.Security.Claims;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Widget { get; }
    public string Level { get; }

    public PermissionRequirement(string widget, string level)
    {
        Widget = widget;
        Level = level;
    }
}

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IUserRepository _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PermissionHandler(IUserRepository userRepository, IHttpContextAccessor httpContextAccessor)
    {
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var orgIdClaim = context.User.FindFirstValue("OrganizationId");

        if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(orgIdClaim)) return;

        var userId = Guid.Parse(userIdClaim);
        var orgId = Guid.Parse(orgIdClaim);

        // Fetch permissions from the database (Cached for performance)
        var permissions = await _userRepository.GetUserWidgetAccessAsync(userId, orgId);

        // Check if the user has the required permission level for this widget
        // Example: If requirement is 'view', and user has 'admin', they pass.
        var hasAccess = permissions.Any(p => 
            p.WidgetKey.Equals(requirement.Widget, StringComparison.OrdinalIgnoreCase) &&
            IsLevelSufficient(p.AccessLevel, requirement.Level));

        if (hasAccess)
        {
            context.Succeed(requirement);
        }
    }

    private bool IsLevelSufficient(string granted, string required)
    {
        if (granted == "admin") return true; // Admins can do anything
        if (granted == required) return true;
        if (granted == "edit" && required == "view") return true;
        return false;
    }
}