using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class MapService : IMapService
{
    private readonly ApplicationDbContext _db;
    private readonly IUserContext _userContext;
    private readonly IWebHostEnvironment _env;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public MapService(
        ApplicationDbContext db,
        IUserContext userContext,
        IWebHostEnvironment env,
        IPublicMediaUrlResolver mediaUrls)
    {
        _db = db;
        _userContext = userContext;
        _env = env;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<IEnumerable<BuildingDto>>> GetBuildingsForOrganizationAsync(Guid organizationId)
    {
        if (organizationId != _userContext.OrganizationId)
            return new ServiceResponse<IEnumerable<BuildingDto>>(false, null,
                new AppError("FORBIDDEN", "You can only access buildings for your active organization."));

        var list = await _db.Buildings
            .AsNoTracking()
            .Where(b => b.OrganizationId == organizationId && !b.IsDeleted)
            .OrderBy(b => b.Name)
            .Select(b => new BuildingDto
            {
                Id = b.Id,
                Name = b.Name,
                ShortCode = b.ShortCode,
                Address = b.Address,
                Latitude = b.Latitude,
                Longitude = b.Longitude
            })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<BuildingDto>>(true, list);
    }

    public async Task<ServiceResponse<IEnumerable<FloorDto>>> GetFloorsForBuildingAsync(Guid buildingId)
    {
        var orgId = _userContext.OrganizationId;

        var building = await _db.Buildings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == buildingId && !b.IsDeleted);

        if (building == null || building.OrganizationId != orgId)
            return new ServiceResponse<IEnumerable<FloorDto>>(false, null,
                new AppError("NOT_FOUND", "Building not found."));

        var floors = await _db.Floors
            .AsNoTracking()
            .Where(f => f.BuildingId == buildingId && !f.IsDeleted)
            .OrderBy(f => f.LevelNumber)
            .Include(f => f.MapPins)
            .Include(f => f.Floorplan)
            .ToListAsync();

        var dtos = floors.Select(f => new FloorDto
        {
            Id = f.Id,
            BuildingId = f.BuildingId,
            LevelNumber = f.LevelNumber,
            FloorplanImageUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(f.FloorplanImageUrl) ? null : f.FloorplanImageUrl),
            FloorplanId = f.Floorplan != null && !f.Floorplan.IsDeleted ? f.Floorplan.Id : null,
            Pins = f.MapPins
                .Where(p => !p.IsDeleted)
                .Select(p => new MapPinDto
                {
                    Id = p.Id,
                    FloorId = p.FloorId,
                    PinType = p.PinType,
                    Label = p.Label,
                    CoordinateX = p.CoordinateX,
                    CoordinateY = p.CoordinateY,
                    RoomId = p.RoomId
                })
                .ToList()
        }).ToList();

        return new ServiceResponse<IEnumerable<FloorDto>>(true, dtos);
    }

    public async Task<ServiceResponse<FloorDto>> CreateFloorForBuildingAsync(Guid buildingId, CreateFloorRequest request)
    {
        var orgId = _userContext.OrganizationId;

        var building = await _db.Buildings
            .FirstOrDefaultAsync(b => b.Id == buildingId && !b.IsDeleted);

        if (building == null || building.OrganizationId != orgId)
            return new ServiceResponse<FloorDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Building not found."));

        if (request.FloorplanFile == null || request.FloorplanFile.Length == 0)
            return new ServiceResponse<FloorDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "No floorplan file uploaded."));

        if (!request.FloorplanFile.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return new ServiceResponse<FloorDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "Only image files are allowed for floorplans."));

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var mapsPath = Path.Combine(webRoot, "images", "maps");
        if (!Directory.Exists(mapsPath))
            Directory.CreateDirectory(mapsPath);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.FloorplanFile.FileName)}";
        var filePath = Path.Combine(mapsPath, fileName);
        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await request.FloorplanFile.CopyToAsync(stream);
        }

        var relativePath = $"/images/maps/{fileName}";

        var floor = new Floor
        {
            Id = Guid.NewGuid(),
            BuildingId = buildingId,
            LevelNumber = request.LevelNumber,
            FloorplanImageUrl = _mediaUrls.ToPublicUrl(relativePath),
            CreatedAt = DateTime.UtcNow
        };

        _db.Floors.Add(floor);
        await _db.SaveChangesAsync();

        return new ServiceResponse<FloorDto>(true, new FloorDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            LevelNumber = floor.LevelNumber,
            FloorplanImageUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(floor.FloorplanImageUrl) ? null : floor.FloorplanImageUrl),
            Pins = new List<MapPinDto>()
        });
    }

    public async Task<ServiceResponse<MapPinDto>> CreatePinForFloorAsync(Guid floorId, CreateMapPinRequest request)
    {
        var orgId = _userContext.OrganizationId;

        var floor = await _db.Floors
            .Include(f => f.Building)
            .FirstOrDefaultAsync(f => f.Id == floorId && !f.IsDeleted);

        if (floor == null || floor.Building.OrganizationId != orgId)
            return new ServiceResponse<MapPinDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floor not found."));

        if (!request.IsEntrance && request.PinType.GetValueOrDefault(PinType.Room) == PinType.Room && request.RoomId == null)
            return new ServiceResponse<MapPinDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "RoomId is required for room pins."));

        Room? room = null;
        if (request.RoomId.HasValue)
        {
            room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == request.RoomId.Value && !r.IsDeleted);
            if (room == null || room.OrganizationId != orgId)
                return new ServiceResponse<MapPinDto>(false, null,
                    new AppError(ErrorCodes.NotFound, "Room not found."));
        }

        var resolvedPinType = request.IsEntrance ? PinType.Exit : request.PinType ?? PinType.Room;
        var label = request.IsEntrance
            ? (string.IsNullOrWhiteSpace(request.Label) ? "Entrance" : request.Label.Trim())
            : request.Label?.Trim();

        var pin = new MapPin
        {
            Id = Guid.NewGuid(),
            FloorId = floorId,
            RoomId = request.IsEntrance ? null : request.RoomId,
            CoordinateX = request.CoordinateX,
            CoordinateY = request.CoordinateY,
            PinType = resolvedPinType,
            Label = label,
            CreatedAt = DateTime.UtcNow
        };

        _db.MapPins.Add(pin);
        await _db.SaveChangesAsync();

        return new ServiceResponse<MapPinDto>(true, new MapPinDto
        {
            Id = pin.Id,
            FloorId = pin.FloorId,
            RoomId = pin.RoomId,
            CoordinateX = pin.CoordinateX,
            CoordinateY = pin.CoordinateY,
            PinType = pin.PinType,
            Label = pin.Label
        });
    }
}
