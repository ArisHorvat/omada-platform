using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class RoomRepository : GenericRepository<Room>, IRoomRepository
{
    public RoomRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Room?> GetRoomWithRestrictionsAsync(Guid id)
    {
        return await _context.Rooms
            .Include(r => r.AllowedEventTypes)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Room>> GetAllRoomsWithRestrictionsAsync(Guid orgId)
    {
        return await _context.Rooms
            .Include(r => r.AllowedEventTypes)
            .AsNoTracking()
            .Where(r => r.OrganizationId == orgId)
            .OrderBy(r => r.Name)
            .ToListAsync();
    }

    public async Task<PagedResponse<Room>> SearchRoomsAsync(Guid orgId, RoomSearchRequest request)
    {
        var query = _context.Rooms
            .Include(r => r.AllowedEventTypes)
            .AsNoTracking()
            .Where(r => r.OrganizationId == orgId && !r.IsDeleted);

        // 1. Basic Filters
        if (request.BuildingIds is { Count: > 0 })
        {
            var bids = request.BuildingIds;
            query = query.Where(r => r.BuildingId.HasValue && bids.Contains(r.BuildingId.Value));
        }

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(term) || (r.Location != null && r.Location.ToLower().Contains(term)));
        }

        if (request.MinCapacity.HasValue)
        {
            query = query.Where(r => r.Capacity >= request.MinCapacity.Value);
        }

        if (request.EventTypeId.HasValue)
        {
            // Room must specifically allow this type (or allow all if list is empty, depending on your rule)
            // Assuming strict: Must be in the list
            query = query.Where(r => r.AllowedEventTypes.Any(et => et.Id == request.EventTypeId));
        }

        if (request.AmenityKeys is { Count: > 0 })
        {
            foreach (var raw in request.AmenityKeys)
            {
                if (string.IsNullOrWhiteSpace(raw) || !Enum.TryParse<RoomAmenity>(raw.Trim(), true, out var amenity))
                    continue;
                var token = $"\"{amenity}\"";
                query = query.Where(r => r.AmenitiesJson != null && r.AmenitiesJson.Contains(token));
            }
        }

        // 2. Availability Filter (The Hard Part)
        if (request.AvailableFrom.HasValue && request.AvailableTo.HasValue)
        {
            var start = request.AvailableFrom.Value;
            var end = request.AvailableTo.Value;

            // Find IDs of rooms that ARE busy
            var busyRoomIds = _context.Events
                .AsNoTracking()
                .Where(e => e.OrganizationId == orgId && !e.IsDeleted)
                .Where(e => e.RoomId.HasValue)
                .Where(e => e.StartTime < end && e.EndTime > start) // Overlap formula
                // Exclude cancelled instances (Simplified check)
                .Where(e => !e.Overrides.Any(o => o.OriginalStartTime == e.StartTime && o.IsCancelled)) 
                .Select(e => e.RoomId!.Value)
                .Distinct();

            // Filter main query to exclude these IDs
            query = query.Where(r => !busyRoomIds.Contains(r.Id));
        }

        // 3. Pagination
        var total = await query.CountAsync();
        var items = await query
            .OrderBy(r => r.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResponse<Room>{
            Items = items,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
