using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Infrastructure.Security;

public static class OfferingTeachingAuthorization
{
    public static async Task<bool> IsOrgAdminAsync(ApplicationDbContext context, Guid orgId, Guid userId)
    {
        return await context.OrganizationMembers.AsNoTracking()
            .AnyAsync(m =>
                m.OrganizationId == orgId &&
                m.UserId == userId &&
                m.IsActive &&
                m.Role.Name == RoleNames.Admin);
    }

    public static async Task<bool> CanTeachOfferingAsync(
        ApplicationDbContext context,
        Guid orgId,
        Guid userId,
        Guid offeringId)
    {
        if (await IsOrgAdminAsync(context, orgId, userId))
            return true;

        var onTeam = await context.OfferingInstructors.AsNoTracking()
            .AnyAsync(i =>
                i.OrganizationId == orgId &&
                i.OfferingId == offeringId &&
                i.UserId == userId &&
                !i.IsDeleted);

        if (onTeam)
            return true;

        return await context.CourseOfferings.AsNoTracking()
            .AnyAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                !o.IsDeleted &&
                o.HostId == userId);
    }

    public static async Task<HashSet<Guid>> GetTeachingOfferingIdsAsync(
        ApplicationDbContext context,
        Guid orgId,
        Guid userId,
        Guid? periodId = null)
    {
        if (await IsOrgAdminAsync(context, orgId, userId))
        {
            var allQuery = context.CourseOfferings.AsNoTracking()
                .Where(o => o.OrganizationId == orgId && !o.IsDeleted);
            if (periodId.HasValue)
                allQuery = allQuery.Where(o => o.PeriodId == periodId.Value);
            return (await allQuery.Select(o => o.Id).ToListAsync()).ToHashSet();
        }

        var fromInstructors = await context.OfferingInstructors.AsNoTracking()
            .Where(i => i.OrganizationId == orgId && i.UserId == userId && !i.IsDeleted)
            .Select(i => i.OfferingId)
            .ToListAsync();

        var hostQuery = context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && !o.IsDeleted && o.HostId == userId);
        if (periodId.HasValue)
            hostQuery = hostQuery.Where(o => o.PeriodId == periodId.Value);

        var fromHost = await hostQuery.Select(o => o.Id).ToListAsync();

        return fromInstructors.Concat(fromHost).ToHashSet();
    }

    /// <summary>Course host (primary instructor) — may edit grade breakdown categories.</summary>
    public static async Task<bool> IsOfferingHostAsync(
        ApplicationDbContext context,
        Guid orgId,
        Guid userId,
        Guid offeringId)
    {
        var offering = await context.CourseOfferings.AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                !o.IsDeleted);

        if (offering?.HostId == userId)
            return true;

        return await context.OfferingInstructors.AsNoTracking()
            .AnyAsync(i =>
                i.OrganizationId == orgId &&
                i.OfferingId == offeringId &&
                i.UserId == userId &&
                !i.IsDeleted &&
                i.Role == OfferingInstructorRoles.Primary);
    }
}
