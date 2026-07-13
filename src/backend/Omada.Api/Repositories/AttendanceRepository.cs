using Microsoft.EntityFrameworkCore;
using Omada.Api.DTOs.Common;
using Omada.Api.Data;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IGroupScopeService _groupScope;

    public AttendanceRepository(ApplicationDbContext context, IGroupScopeService groupScope)
    {
        _context = context;
        _groupScope = groupScope;
    }

    public async Task<IReadOnlyList<EventAttendance>> GetUserRecordsAsync(
        Guid organizationId,
        Guid userId,
        Guid? groupId,
        DateTime fromUtc,
        DateTime toUtc,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<EventAttendance>()
            .AsNoTracking()
            .Include(a => a.Event)
                .ThenInclude(e => e.Group)
            .Include(a => a.Event)
                .ThenInclude(e => e.CohortGroup)
            .Include(a => a.Event)
                .ThenInclude(e => e.EventType)
            .Include(a => a.Event)
                .ThenInclude(e => e.Room)
            .Where(a =>
                a.UserId == userId &&
                !a.IsDeleted &&
                !a.Event.IsDeleted &&
                a.Event.OrganizationId == organizationId &&
                a.InstanceDate >= fromUtc &&
                a.InstanceDate <= toUtc);

        if (groupId.HasValue)
        {
            var scopeIds = await _groupScope.GetDescendantIdsAsync(
                organizationId, groupId.Value, includeSelf: true);
            query = query.Where(a =>
                (a.Event.GroupId.HasValue && scopeIds.Contains(a.Event.GroupId.Value)) ||
                (a.Event.CohortGroupId.HasValue && scopeIds.Contains(a.Event.CohortGroupId.Value)));
        }

        return await query
            .OrderByDescending(a => a.InstanceDate)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResponse<EventAttendance>> GetOrgRecordsPagedAsync(
        Guid organizationId,
        int page,
        int pageSize,
        Guid? userId,
        Guid? groupId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

        var query = _context.Set<EventAttendance>()
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.Event)
                .ThenInclude(e => e.Group)
            .Include(a => a.Event)
                .ThenInclude(e => e.CohortGroup)
            .Where(a =>
                !a.IsDeleted &&
                !a.Event.IsDeleted &&
                a.Event.OrganizationId == organizationId &&
                a.InstanceDate >= fromUtc &&
                a.InstanceDate <= toUtc);

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        if (groupId.HasValue)
        {
            var scopeIds = await _groupScope.GetDescendantIdsAsync(
                organizationId, groupId.Value, includeSelf: true);
            query = query.Where(a =>
                (a.Event.GroupId.HasValue && scopeIds.Contains(a.Event.GroupId.Value)) ||
                (a.Event.CohortGroupId.HasValue && scopeIds.Contains(a.Event.CohortGroupId.Value)));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.InstanceDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<EventAttendance>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
