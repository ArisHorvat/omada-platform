using Omada.Api.Entities;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Infrastructure;

public static class RoleResolution
{
    /// <summary>
    /// Default org role for open-code joins. Prefers Member, then the first non-Admin role.
    /// </summary>
    public static Role? ResolveDefaultAssignableRole(IEnumerable<Role> roles, Guid? excludeRoleId = null)
    {
        var candidates = roles
            .Where(r => !r.IsDeleted)
            .Where(r => !excludeRoleId.HasValue || r.Id != excludeRoleId.Value)
            .Where(r => !r.Name.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return candidates.FirstOrDefault(r => r.Name.Equals(RoleNames.Member, StringComparison.OrdinalIgnoreCase))
            ?? candidates.FirstOrDefault();
    }

    /// <summary>
    /// Join-role resolution including Admin as a last resort when no other roles exist.
    /// </summary>
    public static Role? ResolveJoinRole(IEnumerable<Role> roles) =>
        ResolveDefaultAssignableRole(roles)
        ?? roles.FirstOrDefault(r => !r.IsDeleted);

    /// <summary>
    /// Existing holding role when a custom role is deleted. Never returns arbitrary roles (Dean, Teacher, …).
    /// Prefers Unassigned, then Member.
    /// </summary>
    public static Role? ResolveExistingHoldingRole(IEnumerable<Role> roles, Guid excludeRoleId)
    {
        var candidates = roles
            .Where(r => !r.IsDeleted && r.Id != excludeRoleId)
            .ToList();

        return candidates.FirstOrDefault(r => r.Name.Equals(RoleNames.Unassigned, StringComparison.OrdinalIgnoreCase))
            ?? candidates.FirstOrDefault(r => r.Name.Equals(RoleNames.Member, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Name for a holding role to create when none exists. Deleting Unassigned falls back to Member.
    /// </summary>
    public static string ResolveHoldingRoleNameToCreate(string deletedRoleName) =>
        deletedRoleName.Equals(RoleNames.Unassigned, StringComparison.OrdinalIgnoreCase)
            ? RoleNames.Member
            : RoleNames.Unassigned;
}
