using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Maps;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public sealed class FloorplanProcessingService : IFloorplanProcessingService
{
    private readonly ApplicationDbContext _db;
    private readonly IUserContext _userContext;
    private readonly IWebHostEnvironment _env;
    private readonly IPublicMediaUrlResolver _mediaUrls;
    private readonly IFloorplanGeoJsonExtractor _geoJsonExtractor;
    private readonly ILogger<FloorplanProcessingService> _logger;

    public FloorplanProcessingService(
        ApplicationDbContext db,
        IUserContext userContext,
        IWebHostEnvironment env,
        IPublicMediaUrlResolver mediaUrls,
        IFloorplanGeoJsonExtractor geoJsonExtractor,
        ILogger<FloorplanProcessingService> logger)
    {
        _db = db;
        _userContext = userContext;
        _env = env;
        _mediaUrls = mediaUrls;
        _geoJsonExtractor = geoJsonExtractor;
        _logger = logger;
    }

    public async Task<ServiceResponse<FloorplanDto>> UploadAndProcessAsync(
        Guid floorId,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;

        if (file == null || file.Length == 0)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "No file uploaded."));

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "Only image files are allowed for floorplans."));

        var floor = await _db.Floors
            .Include(f => f.Building)
            .FirstOrDefaultAsync(f => f.Id == floorId && !f.IsDeleted, cancellationToken);

        if (floor == null || floor.Building.OrganizationId != orgId)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floor not found."));

        if (!_geoJsonExtractor.IsConfigured)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.OperationFailed,
                    "Floorplan AI extraction is not configured (set Roboflow:ApiKey)."));

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var mapsPath = Path.Combine(webRoot, "images", "maps", "floorplans");
        if (!Directory.Exists(mapsPath))
            Directory.CreateDirectory(mapsPath);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(mapsPath, fileName);
        await using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 65536, useAsync: true))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var relativePath = $"/images/maps/floorplans/{fileName}";

        string geoJsonRaw;
        try
        {
            await using var readStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 65536, FileOptions.Asynchronous);
            using var ms = new MemoryStream();
            await readStream.CopyToAsync(ms, cancellationToken);
            geoJsonRaw = await _geoJsonExtractor.ExtractGeoJsonAsync(ms.ToArray(), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI floorplan processing failed for floor {FloorId}", floorId);
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.OperationFailed, "Floorplan processing failed.", ex.Message));
        }

        var geoJsonData = NormalizeGeoJsonPayload(geoJsonRaw);

        var existing = await _db.Floorplans
            .FirstOrDefaultAsync(p => p.FloorId == floorId && !p.IsDeleted, cancellationToken);

        if (existing != null)
        {
            existing.ImageUrl = relativePath;
            existing.GeoJsonData = geoJsonData;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return new ServiceResponse<FloorplanDto>(true, MapToDto(existing));
        }

        var entity = new Floorplan
        {
            Id = Guid.NewGuid(),
            FloorId = floorId,
            ImageUrl = relativePath,
            GeoJsonData = geoJsonData,
            CreatedAt = DateTime.UtcNow
        };
        _db.Floorplans.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new ServiceResponse<FloorplanDto>(true, MapToDto(entity));
    }

    public async Task<ServiceResponse<FloorplanDto>> GetByIdAsync(Guid floorplanId, CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;

        var entity = await _db.Floorplans
            .AsNoTracking()
            .Include(p => p.Floor)
            .ThenInclude(f => f.Building)
            .FirstOrDefaultAsync(p => p.Id == floorplanId && !p.IsDeleted, cancellationToken);

        if (entity == null || entity.Floor.Building.OrganizationId != orgId)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floorplan not found."));

        return new ServiceResponse<FloorplanDto>(true, MapToDto(entity));
    }

    public async Task<ServiceResponse<FloorplanDto>> UpdateGeoJsonAsync(
        Guid floorplanId,
        string geoJsonData,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;

        if (string.IsNullOrWhiteSpace(geoJsonData))
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "GeoJSON payload is required."));

        string normalized;
        try
        {
            using var doc = JsonDocument.Parse(geoJsonData.Trim());
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("type", out var t)
                || !string.Equals(t.GetString(), "FeatureCollection", StringComparison.OrdinalIgnoreCase))
            {
                return new ServiceResponse<FloorplanDto>(false, null,
                    new AppError(ErrorCodes.InvalidInput, "GeoJSON must be a FeatureCollection object."));
            }

            if (!root.TryGetProperty("features", out var feats) || feats.ValueKind != JsonValueKind.Array)
            {
                return new ServiceResponse<FloorplanDto>(false, null,
                    new AppError(ErrorCodes.InvalidInput, "FeatureCollection must include a \"features\" array."));
            }

            normalized = root.GetRawText();
        }
        catch (JsonException ex)
        {
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.InvalidInput, "Invalid JSON.", ex.Message));
        }

        var entity = await _db.Floorplans
            .FirstOrDefaultAsync(p => p.Id == floorplanId && !p.IsDeleted, cancellationToken);

        if (entity == null)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floorplan not found."));

        await _db.Entry(entity).Reference(p => p.Floor).LoadAsync(cancellationToken);
        if (entity.Floor == null || entity.Floor.IsDeleted)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floorplan not found."));

        await _db.Entry(entity.Floor).Reference(f => f.Building).LoadAsync(cancellationToken);
        if (entity.Floor.Building.OrganizationId != orgId)
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floorplan not found."));

        entity.GeoJsonData = normalized;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return new ServiceResponse<FloorplanDto>(true, MapToDto(entity));
    }

    public async Task<ServiceResponse<FloorplanRoomPublishResultDto>> PublishRoomsFromGeoJsonAsync(
        Guid floorplanId,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;

        var entity = await _db.Floorplans
            .Include(p => p.Floor)
            .ThenInclude(f => f.Building)
            .FirstOrDefaultAsync(p => p.Id == floorplanId && !p.IsDeleted, cancellationToken);

        if (entity == null || entity.Floor == null || entity.Floor.IsDeleted)
            return new ServiceResponse<FloorplanRoomPublishResultDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floorplan not found."));

        if (entity.Floor.Building.OrganizationId != orgId)
            return new ServiceResponse<FloorplanRoomPublishResultDto>(false, null,
                new AppError(ErrorCodes.NotFound, "Floorplan not found."));

        var floor = entity.Floor;
        var buildingId = floor.BuildingId;
        var candidates = FloorplanGeoJsonRoomPublishParser.ExtractPublishablePolygons(entity.GeoJsonData);
        if (candidates.Count == 0)
        {
            return new ServiceResponse<FloorplanRoomPublishResultDto>(true, new FloorplanRoomPublishResultDto
            {
                CreatedCount = 0,
                UpdatedCount = 0,
                SkippedCount = 0
            });
        }

        var existing = await _db.Rooms
            .Where(r => r.OrganizationId == orgId && r.FloorId == floor.Id && !r.IsDeleted)
            .ToListAsync(cancellationToken);

        var created = 0;
        var updated = 0;
        foreach (var p in candidates)
        {
            var name = TruncateRoomName(p.RoomName);
            var room = existing.FirstOrDefault(r =>
                           !string.IsNullOrEmpty(r.FloorplanFeatureKey) &&
                           string.Equals(r.FloorplanFeatureKey, p.RoomId, StringComparison.Ordinal))
                       ?? existing.FirstOrDefault(r =>
                           string.Equals(r.Name.Trim(), name.Trim(), StringComparison.OrdinalIgnoreCase));

            if (room == null)
            {
                var nr = new Room
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    Name = name,
                    Capacity = GuessCapacity(p.RoomName),
                    IsBookable = p.IsBookable,
                    BuildingId = buildingId,
                    FloorId = floor.Id,
                    CoordinateX = p.CentroidX,
                    CoordinateY = p.CentroidY,
                    FloorplanFeatureKey = p.RoomId.Length > 128 ? p.RoomId[..128] : p.RoomId,
                    MapIconKey = p.MapIconKey,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Rooms.Add(nr);
                existing.Add(nr);
                created++;
            }
            else
            {
                room.Name = name;
                room.IsBookable = p.IsBookable;
                room.CoordinateX = p.CentroidX;
                room.CoordinateY = p.CentroidY;
                room.MapIconKey = p.MapIconKey;
                room.FloorId = floor.Id;
                room.BuildingId = buildingId;
                // Always sync the stable GeoJSON feature id so the indoor map can resolve polygons after re-save.
                room.FloorplanFeatureKey = p.RoomId.Length > 128 ? p.RoomId[..128] : p.RoomId;
                room.UpdatedAt = DateTime.UtcNow;
                updated++;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new ServiceResponse<FloorplanRoomPublishResultDto>(true, new FloorplanRoomPublishResultDto
        {
            CreatedCount = created,
            UpdatedCount = updated,
            SkippedCount = 0
        });
    }

    private static string TruncateRoomName(string name)
    {
        var t = (name ?? "Room").Trim();
        return t.Length <= 100 ? t : t[..100];
    }

    private static int GuessCapacity(string roomName)
    {
        var n = roomName.ToLowerInvariant();
        if (n.Contains("conference", StringComparison.Ordinal) || n.Contains("meeting", StringComparison.Ordinal)
            || n.Contains("boardroom", StringComparison.Ordinal) || n.Contains("seminar", StringComparison.Ordinal))
            return 8;
        if (n.Contains("class", StringComparison.Ordinal) || n.Contains("lecture", StringComparison.Ordinal))
            return 30;
        return 4;
    }

    private FloorplanDto MapToDto(Floorplan entity)
    {
        var publicImage = _mediaUrls.ToPublicUrl(entity.ImageUrl) ?? entity.ImageUrl;
        return new FloorplanDto
        {
            Id = entity.Id,
            FloorId = entity.FloorId,
            ImageUrl = publicImage,
            GeoJsonData = entity.GeoJsonData
        };
    }

    /// <summary>
    /// Accepts either a raw GeoJSON object or a wrapper with geoJson/geojson property.
    /// </summary>
    private static string NormalizeGeoJsonPayload(string jsonBody)
    {
        if (string.IsNullOrWhiteSpace(jsonBody))
            return "{}";

        try
        {
            using var doc = JsonDocument.Parse(jsonBody);
            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.Object)
            {
                if (root.TryGetProperty("geoJson", out var g1))
                    return g1.GetRawText();
                if (root.TryGetProperty("geojson", out var g2))
                    return g2.GetRawText();
                if (root.TryGetProperty("type", out var t) && t.ValueKind == JsonValueKind.String
                    && string.Equals(t.GetString(), "FeatureCollection", StringComparison.OrdinalIgnoreCase))
                    return root.GetRawText();
            }

            return root.GetRawText();
        }
        catch (JsonException)
        {
            return jsonBody.Trim();
        }
    }
}
