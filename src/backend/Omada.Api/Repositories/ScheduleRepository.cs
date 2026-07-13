using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Repositories;

public class ScheduleRepository : GenericRepository<Event>, IScheduleRepository
{
    private readonly IGroupScopeService _groupScope;

    public ScheduleRepository(ApplicationDbContext context, IGroupScopeService groupScope) : base(context)
    {
        _groupScope = groupScope;
    }

    // 🚀 NEW: Optimized fetch for the Schedule Service
    // Fetches events that overlap the window OR have a recurrence rule (since they might expand into the window)
    // Change the signature to accept userId and myScheduleOnly
    public async Task<IEnumerable<Event>> GetEventsForScheduleAsync(
        Guid orgId, 
        DateTime from, 
        DateTime to, 
        Guid? hostId = null, 
        Guid? groupId = null, 
        Guid? roomId = null,
        Guid? userId = null,
        bool myScheduleOnly = false,
        bool publicOnly = false,
        Guid? periodId = null,
        Guid? offeringId = null,
        Guid? programGroupId = null)
    {
        var query = _context.Events
            .AsNoTracking()
            .AsSplitQuery()
            .Include(e => e.Overrides)
            .Include(e => e.EventType)
            .Include(e => e.Room)
            .Include(e => e.Group)
            .Include(e => e.Offering)
            .Include(e => e.CohortGroup)
            .Include(e => e.Host)
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted);

        if (myScheduleOnly && userId.HasValue)
        {
            query = query.Include(e => e.Attendances.Where(a =>
                a.UserId == userId.Value ||
                a.Status == AttendanceStatus.Added ||
                a.Status == AttendanceStatus.Expected ||
                a.Status == AttendanceStatus.Accepted ||
                a.Status == AttendanceStatus.Tentative ||
                a.Status == AttendanceStatus.Declined));
        }
        else
        {
            query = query.Include(e => e.Attendances);
        }

        // Apply Time Window 
        query = query.Where(e =>
            (e.StartTime < to && e.EndTime > from) ||
            (e.RecurrenceRule != null && e.StartTime < to));

        if (publicOnly)
            query = query.Where(e => e.IsPublic);

        if (periodId.HasValue)
            query = query.Where(e => e.PeriodId == periodId.Value);

        if (offeringId.HasValue)
            query = query.Where(e => e.OfferingId == offeringId.Value);

        if (programGroupId.HasValue)
        {
            var programOfferingIds = _context.CourseOfferingPrograms
                .AsNoTracking()
                .Where(p => p.OrganizationId == orgId && p.ProgramGroupId == programGroupId.Value)
                .Select(p => p.OfferingId);
            query = query.Where(e => e.OfferingId.HasValue && programOfferingIds.Contains(e.OfferingId.Value));
        }

        if (hostId.HasValue) query = query.Where(e => e.HostId == hostId);
        if (groupId.HasValue)
        {
            var scopeIds = await _groupScope.GetDescendantIdsAsync(orgId, groupId.Value, includeSelf: true);
            query = query.Where(e =>
                (e.GroupId.HasValue && scopeIds.Contains(e.GroupId.Value)) ||
                (e.CohortGroupId.HasValue && scopeIds.Contains(e.CohortGroupId.Value)));
        }
        if (roomId.HasValue) query = query.Where(e => e.RoomId == roomId);

        // "My Schedule" — filter in memory so offering audience matches timetable publish rules.
        if (myScheduleOnly && userId.HasValue)
        {
            var visibility = await LoadUserVisibilityContextAsync(orgId, userId.Value);
            var list = await query.ToListAsync();
            return list.Where(visibility.IsEventVisible).ToList();
        }

        return await query.ToListAsync();
    }

    private async Task<ScheduleUserVisibilityContext> LoadUserVisibilityContextAsync(Guid orgId, Guid userId)
    {
        var userGroupIds = await _groupScope.GetUserEffectiveGroupIdsAsync(orgId, userId);

        var enrollments = await _context.OfferingEnrollments
            .AsNoTracking()
            .Where(e => e.UserId == userId && e.OrganizationId == orgId && !e.IsDeleted)
            .Select(e => new { e.OfferingId, e.CohortGroupId })
            .ToListAsync();

        var enrolledOfferingIds = enrollments.Select(e => e.OfferingId).ToHashSet();
        var enrollmentCohortsByOffering = enrollments
            .Where(e => e.CohortGroupId.HasValue)
            .GroupBy(e => e.OfferingId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.CohortGroupId!.Value).ToHashSet());

        var teachingOfferingIds = await _context.OfferingInstructors
            .AsNoTracking()
            .Where(i => i.UserId == userId && i.OrganizationId == orgId && !i.IsDeleted)
            .Select(i => i.OfferingId)
            .ToListAsync();

        return new ScheduleUserVisibilityContext
        {
            UserId = userId,
            UserGroupIds = userGroupIds,
            EnrolledOfferingIds = enrolledOfferingIds,
            EnrollmentCohortIdsByOffering = enrollmentCohortsByOffering,
            TeachingOfferingIds = teachingOfferingIds.ToHashSet()
        };
    }

    public async Task<Event?> GetConflictAsync(Guid orgId, DateTime start, DateTime end, Guid? roomId, Guid? hostId)
    {
        if (!roomId.HasValue && !hostId.HasValue) return null;

        var potentialConflicts = await _context.Events
            .Include(e => e.Overrides)
            .AsNoTracking()
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted)
            .Where(e => e.StartTime < end && e.EndTime > start) // Overlap check
            .Where(e => (roomId.HasValue && e.RoomId == roomId) || (hostId.HasValue && e.HostId == hostId))
            .ToListAsync();

        foreach (var evt in potentialConflicts)
        {
            // Ignore cancelled instances
            var isCancelled = evt.Overrides.Any(o => 
                o.IsCancelled && Math.Abs((o.OriginalStartTime - start).TotalMinutes) < 1);
            
            if (!isCancelled) return evt;
        }

        return null;
    }

    // 3. 🚀 FIXED: Search Hosts using OrganizationMember
    // This replaces the logic that required GetQueryable()
    public async Task<IEnumerable<User>> SearchHostsAsync(Guid orgId, string query)
    {
        // We query OrganizationMembers to find users in this specific Org
        return await _context.OrganizationMembers
            .Include(om => om.User)
            .AsNoTracking()
            .Where(om => om.OrganizationId == orgId && 
                        (om.User.FirstName.Contains(query) || 
                         om.User.LastName.Contains(query) || 
                         om.User.Email.Contains(query)))
            .Take(10)
            .Select(om => om.User)
            .ToListAsync();
    }
}