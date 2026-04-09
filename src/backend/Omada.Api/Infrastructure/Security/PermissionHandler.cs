using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Omada.Api.Data;
using Omada.Api.Entities;
using System.Security.Claims;

namespace Omada.Api.Infrastructure.Security;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IMemoryCache _cache;

    public PermissionHandler(IServiceProvider serviceProvider, IMemoryCache cache)
    {
        _serviceProvider = serviceProvider;
        _cache = cache;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var userIdStr = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? context.User.FindFirst("sub")?.Value;
        var orgIdStr = context.User.FindFirst("OrganizationId")?.Value;

        if (string.IsNullOrEmpty(userIdStr) || string.IsNullOrEmpty(orgIdStr))
        {
            context.Fail();
            return;
        }

        // JWT and DB may use "SuperAdmin" (bootstrap) or seeded role name "Super Admin".
        if (context.User.IsInRole("SuperAdmin") || context.User.IsInRole("Super Admin"))
        {
            context.Succeed(requirement);
            return;
        }

        var userId = Guid.Parse(userIdStr);
        var orgId = Guid.Parse(orgIdStr);

        var cacheKey = $"permissions_{userId}_{orgId}";

        if (!_cache.TryGetValue(cacheKey, out List<string>? userPermissions))
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var permissions = await dbContext.OrganizationMembers
                .AsNoTracking()
                .Where(m => m.UserId == userId && m.OrganizationId == orgId)
                .SelectMany(m => m.Role.Permissions)
                .ToListAsync();

            userPermissions = permissions.Select(p => $"{p.WidgetKey}:{p.AccessLevel.ToString().ToLowerInvariant()}").ToList();

            _cache.Set(cacheKey, userPermissions, TimeSpan.FromMinutes(15));
        }

        if (userPermissions != null &&
            MeetsRequirement(userPermissions, requirement.WidgetKey, requirement.RequiredLevel))
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }
    }

    /// <summary>
    /// Enforces View &lt; Edit &lt; Admin: e.g. <c>news:edit</c> satisfies <see cref="AccessLevel.View"/> but not <see cref="AccessLevel.Admin"/>.
    /// Matches <see cref="RolePermission"/> rows stored per widget (one effective level per widget on the role).
    /// </summary>
    internal static bool MeetsRequirement(List<string> userPermissions, string widget, AccessLevel required)
    {
        var effective = GetEffectiveRank(userPermissions, widget);
        var needed = required switch
        {
            AccessLevel.View => 1,
            AccessLevel.Edit => 2,
            AccessLevel.Admin => 3,
            _ => 0
        };

        return effective >= needed;
    }

    private static int GetEffectiveRank(List<string> userPermissions, string widget)
    {
        if (userPermissions.Contains($"{widget}:admin")) return 3;
        if (userPermissions.Contains($"{widget}:edit")) return 2;
        if (userPermissions.Contains($"{widget}:view")) return 1;
        return 0;
    }
}