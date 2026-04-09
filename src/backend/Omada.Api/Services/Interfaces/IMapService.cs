using Omada.Api.Abstractions;
using Omada.Api.DTOs.Rooms;

namespace Omada.Api.Services.Interfaces;

public interface IMapService
{
    Task<ServiceResponse<IEnumerable<BuildingDto>>> GetBuildingsForOrganizationAsync(Guid organizationId);
    Task<ServiceResponse<IEnumerable<FloorDto>>> GetFloorsForBuildingAsync(Guid buildingId);
    Task<ServiceResponse<FloorDto>> CreateFloorForBuildingAsync(Guid buildingId, CreateFloorRequest request);
    Task<ServiceResponse<MapPinDto>> CreatePinForFloorAsync(Guid floorId, CreateMapPinRequest request);
}
