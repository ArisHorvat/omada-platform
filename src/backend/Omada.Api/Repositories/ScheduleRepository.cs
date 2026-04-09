using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class ScheduleRepository : GenericRepository<Event>, IScheduleRepository
{
    public ScheduleRepository(ApplicationDbContext context) : base(context) { }

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
        bool publicOnly = false)
    {
        var query = _context.Events
            .Include(e => e.Overrides)
            .Include(e => e.Attendances) // 🚀 Load Attendance Exceptions
            .Include(e => e.EventType) 
            .Include(e => e.Room)      
            .Include(e => e.Group)     
            .Include(e => e.Host)
            .AsNoTracking()
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted);

        // Apply Time Window 
        query = query.Where(e => (e.StartTime < to && e.EndTime > from) || e.RecurrenceRule != null);

        // 🚀 NEW: "My Schedule" Logic
        if (myScheduleOnly && userId.HasValue)
        {
            // Get the groups this user belongs to
            var userGroupIds = _context.Set<GroupMember>()
                .AsNoTracking()
                .Where(gm => gm.UserId == userId.Value)
                .Select(gm => gm.GroupId)
                .ToList();

            query = query.Where(e => 
                e.HostId == userId.Value || // I am the host
                (e.GroupId.HasValue && userGroupIds.Contains(e.GroupId.Value)) || // My class is taking it
                e.Attendances.Any(a => a.UserId == userId.Value &&
                    (a.Status == AttendanceStatus.Added || a.Status == AttendanceStatus.Expected)) // enrolled / joined
            );
        }

        if (publicOnly)
            query = query.Where(e => e.IsPublic);

        if (hostId.HasValue) query = query.Where(e => e.HostId == hostId);
        if (groupId.HasValue) query = query.Where(e => e.GroupId == groupId);
        if (roomId.HasValue) query = query.Where(e => e.RoomId == roomId);

        return await query.ToListAsync();
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