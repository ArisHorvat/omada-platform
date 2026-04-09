using System.Net.Http.Headers;
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
    public const string FloorplanAiHttpClientName = "FloorplanAi";

    private readonly ApplicationDbContext _db;
    private readonly IUserContext _userContext;
    private readonly IWebHostEnvironment _env;
    private readonly IPublicMediaUrlResolver _mediaUrls;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FloorplanProcessingService> _logger;

    public FloorplanProcessingService(
        ApplicationDbContext db,
        IUserContext userContext,
        IWebHostEnvironment env,
        IPublicMediaUrlResolver mediaUrls,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<FloorplanProcessingService> logger)
    {
        _db = db;
        _userContext = userContext;
        _env = env;
        _mediaUrls = mediaUrls;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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

        var baseUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrEmpty(baseUrl))
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.OperationFailed, "AI floorplan service is not configured (AiService:BaseUrl)."));

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
            geoJsonRaw = await CallAiProcessFloorplanAsync(baseUrl, filePath, file.FileName, file.ContentType, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI floorplan processing failed for floor {FloorId}", floorId);
            return new ServiceResponse<FloorplanDto>(false, null,
                new AppError(ErrorCodes.OperationFailed, "Floorplan processing service failed.", ex.Message));
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

    private async Task<string> CallAiProcessFloorplanAsync(
        string baseUrl,
        string savedFilePath,
        string originalFileName,
        string? contentType,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(FloorplanAiHttpClientName);
        using var content = new MultipartFormDataContent();
        await using var stream = new FileStream(savedFilePath, FileMode.Open, FileAccess.Read, FileShare.Read, 65536, FileOptions.Asynchronous);
        var streamContent = new StreamContent(stream);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(
            string.IsNullOrEmpty(contentType) ? "application/octet-stream" : contentType);
        content.Add(streamContent, "file", originalFileName);

        var response = await client.PostAsync(new Uri($"{baseUrl}/process-floorplan"), content, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"AI service returned {(int)response.StatusCode}: {body}");
        }

        return body;
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
