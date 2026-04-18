using Microsoft.AspNetCore.Http;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Maps;

namespace Omada.Api.Services.Interfaces;

public interface IFloorplanProcessingService
{
    /// <summary>
    /// Stores the image, calls the AI microservice for GeoJSON, and upserts the floorplan row for the floor.
    /// </summary>
    Task<ServiceResponse<FloorplanDto>> UploadAndProcessAsync(Guid floorId, IFormFile file, CancellationToken cancellationToken = default);

    Task<ServiceResponse<FloorplanDto>> GetByIdAsync(Guid floorplanId, CancellationToken cancellationToken = default);

    /// <summary>Replace stored GeoJSON (e.g. admin manual corrections). Does not re-run AI.</summary>
    Task<ServiceResponse<FloorplanDto>> UpdateGeoJsonAsync(Guid floorplanId, string geoJsonData, CancellationToken cancellationToken = default);
}
