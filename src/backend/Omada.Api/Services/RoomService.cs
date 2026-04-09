using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Rooms;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class RoomService : IRoomService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IRoomRepository _roomRepo;

    public RoomService(IUnitOfWork uow, IUserContext userContext, IRoomRepository roomRepo)
    {
        _uow = uow;
        _userContext = userContext;
        _roomRepo = roomRepo;
    }

    public async Task<ServiceResponse<IEnumerable<RoomDto>>> GetAllRoomsAsync()
    {
        var orgId = _userContext.OrganizationId;
        var rooms = await _roomRepo.GetAllRoomsWithRestrictionsAsync(orgId);

        var dtos = rooms.Select(MapToDto);
        return new ServiceResponse<IEnumerable<RoomDto>>(true, dtos);
    }

    public async Task<ServiceResponse<PagedResponse<RoomDto>>> SearchRoomsAsync(RoomSearchRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var pagedData = await _roomRepo.SearchRoomsAsync(orgId, request);

        var dtos = pagedData.Items.Select(MapToDto);
        
        var response = new PagedResponse<RoomDto>{
            Items = dtos,
            Page = pagedData.Page,
            PageSize = pagedData.PageSize,
            TotalCount = pagedData.TotalCount
        };
        return new ServiceResponse<PagedResponse<RoomDto>>(true, response);
    }

    public async Task<ServiceResponse<RoomDto>> GetRoomByIdAsync(Guid id)
    {
        var orgId = _userContext.OrganizationId;
        var room = await _roomRepo.GetRoomWithRestrictionsAsync(id);

        if (room == null || room.OrganizationId != orgId)
            return new ServiceResponse<RoomDto>(false, null, new AppError("NOT_FOUND", "Room not found."));

        return new ServiceResponse<RoomDto>(true, MapToDto(room));
    }

    public async Task<ServiceResponse<RoomDto>> CreateRoomAsync(CreateRoomRequest request)
    {
        var orgId = _userContext.OrganizationId;

        var room = new Room
        {
            OrganizationId = orgId,
            Name = request.Name,
            Location = request.Location,
            Capacity = request.Capacity,
            IsBookable = request.IsBookable
        };

        var placementError = await TryApplyBuildingFloorAndRoleAsync(request, orgId, room);
        if (placementError != null)
            return new ServiceResponse<RoomDto>(false, null, placementError);

        // Handle Relationships
        if (request.AllowedEventTypeIds != null && request.AllowedEventTypeIds.Any())
        {
            var types = await _uow.Repository<EventType>()
                .GetQueryable()
                .Where(t => request.AllowedEventTypeIds.Contains(t.Id) && t.OrganizationId == orgId)
                .ToListAsync();
            
            room.AllowedEventTypes = types;
        }

        await _uow.Repository<Room>().AddAsync(room);
        await _uow.CompleteAsync();

        return new ServiceResponse<RoomDto>(true, MapToDto(room));
    }

    public async Task<ServiceResponse<RoomDto>> UpdateRoomAsync(Guid id, CreateRoomRequest request)
    {
        var orgId = _userContext.OrganizationId;

        // Load with Include to update the Many-to-Many list correctly
        var room = await _uow.Repository<Room>()
            .GetQueryable()
            .Include(r => r.AllowedEventTypes)
            .FirstOrDefaultAsync(r => r.Id == id && r.OrganizationId == orgId);

        if (room == null)
            return new ServiceResponse<RoomDto>(false, null, new AppError("NOT_FOUND", "Room not found."));

        // Update Fields
        room.Name = request.Name;
        room.Location = request.Location;
        room.Capacity = request.Capacity;
        room.IsBookable = request.IsBookable;

        var placementError = await TryApplyBuildingFloorAndRoleAsync(request, orgId, room);
        if (placementError != null)
            return new ServiceResponse<RoomDto>(false, null, placementError);

        // Update Restrictions
        room.AllowedEventTypes.Clear();
        if (request.AllowedEventTypeIds != null && request.AllowedEventTypeIds.Any())
        {
            var types = await _uow.Repository<EventType>()
                .GetQueryable()
                .Where(t => request.AllowedEventTypeIds.Contains(t.Id) && t.OrganizationId == orgId)
                .ToListAsync();

            foreach (var t in types) room.AllowedEventTypes.Add(t);
        }

        _uow.Repository<Room>().Update(room);
        await _uow.CompleteAsync();

        return new ServiceResponse<RoomDto>(true, MapToDto(room));
    }

    public async Task<ServiceResponse<bool>> DeleteRoomAsync(Guid id)
    {
        var orgId = _userContext.OrganizationId;
        var room = await _uow.Repository<Room>().GetByIdAsync(id);

        if (room == null || room.OrganizationId != orgId)
            return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Room not found."));

        _uow.Repository<Room>().Remove(room);
        await _uow.CompleteAsync();

        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<RoomBookingDto>> BookRoomAsync(Guid roomId, BookRoomRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var room = await _uow.Repository<Room>()
            .GetQueryable()
            .FirstOrDefaultAsync(r => r.Id == roomId && r.OrganizationId == orgId && !r.IsDeleted);

        if (room == null)
            return new ServiceResponse<RoomBookingDto>(false, null, new AppError("NOT_FOUND", "Room not found."));

        if (!room.IsBookable)
            return new ServiceResponse<RoomBookingDto>(false, null, new AppError("NOT_BOOKABLE", "This room is not available for booking."));

        if (room.RequiredRoleId.HasValue)
        {
            var member = await _uow.Repository<OrganizationMember>()
                .GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(m =>
                    m.OrganizationId == orgId && m.UserId == userId && m.IsActive);

            if (member == null || member.RoleId != room.RequiredRoleId.Value)
                return new ServiceResponse<RoomBookingDto>(false, null,
                    new AppError("FORBIDDEN", "Your role is not allowed to book this room."));
        }

        var start = request.StartUtc;
        var end = request.EndUtc;

        var bookingOverlap = await _uow.Repository<RoomBooking>()
            .GetQueryable()
            .AnyAsync(b =>
                b.RoomId == roomId &&
                !b.IsDeleted &&
                b.OrganizationId == orgId &&
                b.StartUtc < end &&
                b.EndUtc > start);

        if (bookingOverlap)
            return new ServiceResponse<RoomBookingDto>(false, null,
                new AppError("ROOM_CONFLICT", "This time overlaps an existing booking."));

        var eventOverlap = await _uow.Repository<Event>()
            .GetQueryable()
            .AsNoTracking()
            .Include(e => e.Overrides)
            .AnyAsync(e =>
                e.RoomId == roomId &&
                e.OrganizationId == orgId &&
                !e.IsDeleted &&
                string.IsNullOrEmpty(e.RecurrenceRule) &&
                e.StartTime < end &&
                e.EndTime > start &&
                !e.Overrides.Any(o => o.OriginalStartTime == e.StartTime && o.IsCancelled));

        if (eventOverlap)
            return new ServiceResponse<RoomBookingDto>(false, null,
                new AppError("ROOM_CONFLICT", "This time overlaps a scheduled event in this room."));

        var booking = new RoomBooking
        {
            OrganizationId = orgId,
            RoomId = roomId,
            BookedByUserId = userId,
            StartUtc = start,
            EndUtc = end,
            Notes = request.Notes
        };

        await _uow.Repository<RoomBooking>().AddAsync(booking);
        await _uow.CompleteAsync();

        return new ServiceResponse<RoomBookingDto>(true, MapBookingToDto(booking));
    }

    private async Task<AppError?> TryApplyBuildingFloorAndRoleAsync(CreateRoomRequest request, Guid orgId, Room room)
    {
        if (request.FloorId.HasValue)
        {
            var floor = await _uow.Repository<Floor>()
                .GetQueryable()
                .Include(f => f.Building)
                .FirstOrDefaultAsync(f => f.Id == request.FloorId.Value && !f.IsDeleted);

            if (floor == null || floor.Building.OrganizationId != orgId)
                return new AppError("INVALID_FLOOR", "The specified floor was not found in this organization.");

            if (request.BuildingId.HasValue && request.BuildingId.Value != floor.BuildingId)
                return new AppError("INVALID_BUILDING", "Building does not match the selected floor.");

            room.FloorId = floor.Id;
            room.BuildingId = floor.BuildingId;
        }
        else
        {
            room.FloorId = null;
            if (request.BuildingId.HasValue)
            {
                var building = await _uow.Repository<Building>().GetByIdAsync(request.BuildingId.Value);
                if (building == null || building.OrganizationId != orgId)
                    return new AppError("INVALID_BUILDING", "The specified building was not found.");
                room.BuildingId = request.BuildingId;
            }
            else
            {
                room.BuildingId = null;
            }
        }

        room.CoordinateX = request.CoordinateX;
        room.CoordinateY = request.CoordinateY;
        room.CustomAttributes = request.CustomAttributes;

        if (request.RequiredRoleId.HasValue)
        {
            var role = await _uow.Repository<Role>().GetByIdAsync(request.RequiredRoleId.Value);
            if (role == null || role.OrganizationId != orgId)
                return new AppError("INVALID_ROLE", "The specified role was not found in this organization.");
            room.RequiredRoleId = request.RequiredRoleId;
        }
        else
        {
            room.RequiredRoleId = null;
        }

        return null;
    }

    private static RoomBookingDto MapBookingToDto(RoomBooking b) =>
        new()
        {
            Id = b.Id,
            RoomId = b.RoomId,
            BookedByUserId = b.BookedByUserId,
            StartUtc = b.StartUtc,
            EndUtc = b.EndUtc,
            Notes = b.Notes
        };

    private static IReadOnlyList<string> ParseAmenitiesJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Array.Empty<string>();
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json);
            if (list == null || list.Count == 0)
                return Array.Empty<string>();
            return list;
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }

    private static RoomDto MapToDto(Room room)
    {
        return new RoomDto
        {
            Id = room.Id,
            Name = room.Name,
            Location = room.Location,
            Capacity = room.Capacity,
            IsBookable = room.IsBookable,
            BuildingId = room.BuildingId,
            FloorId = room.FloorId,
            CoordinateX = room.CoordinateX,
            CoordinateY = room.CoordinateY,
            Resources = room.Resources,
            CustomAttributes = room.CustomAttributes,
            Amenities = ParseAmenitiesJson(room.AmenitiesJson).ToList(),
            RequiredRoleId = room.RequiredRoleId,
            AllowedEventTypes = room.AllowedEventTypes.Select(et => new EventTypeDto
            {
                Id = et.Id,
                Name = et.Name,
                Color = et.ColorHex
            }).ToList()
        };
    }
}