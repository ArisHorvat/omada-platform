using Omada.Api.Abstractions;
using Omada.Api.DTOs.Rooms;

namespace Omada.Api.Services.Interfaces;

public interface IMapService
{
    Task<ServiceResponse<IEnumerable<BuildingDto>>> GetBuildingsForOrganizationAsync(Guid organizationId);
    Task<ServiceResponse<BuildingDto>> CreateBuildingAsync(CreateBuildingRequest request);
    Task<ServiceResponse<BuildingDto>> UpdateBuildingAsync(Guid buildingId, UpdateBuildingRequest request);
    Task<ServiceResponse<bool>> DeleteBuildingAsync(Guid buildingId);
    Task<ServiceResponse<IEnumerable<FloorDto>>> GetFloorsForBuildingAsync(Guid buildingId);
    Task<ServiceResponse<FloorDto>> CreateFloorForBuildingAsync(Guid buildingId, CreateFloorRequest request);
    Task<ServiceResponse<bool>> DeleteFloorAsync(Guid floorId);
    Task<ServiceResponse<MapPinDto>> CreatePinForFloorAsync(Guid floorId, CreateMapPinRequest request);
    Task<ServiceResponse<bool>> DeleteMapPinAsync(Guid pinId);
}
