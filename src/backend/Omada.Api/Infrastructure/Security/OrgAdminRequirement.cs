using Microsoft.AspNetCore.Authorization;

namespace Omada.Api.Infrastructure.Security;

/// <summary>
/// Organization <see cref="Constants.RoleNames.Admin"/> or platform super-admin — curriculum structure (periods, offerings).
/// Not gated by the <c>settings</c> widget; org admins always have access.
/// </summary>
public class OrgAdminRequirement : IAuthorizationRequirement;

public class OrgAdminHandler : AuthorizationHandler<OrgAdminRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OrgAdminRequirement requirement)
    {
        if (context.User.IsInRole("SuperAdmin") ||
            context.User.IsInRole("Super Admin") ||
            context.User.IsInRole("Admin"))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
