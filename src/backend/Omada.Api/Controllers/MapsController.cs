using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class MapsController : ControllerBase
{
    private readonly IMapService _mapService;

    public MapsController(IMapService mapService)
    {
        _mapService = mapService;
    }

    [HttpGet("organizations/{organizationId:guid}/buildings")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<BuildingDto>>>> GetBuildingsForOrganization(Guid organizationId)
    {
        var response = await _mapService.GetBuildingsForOrganizationAsync(organizationId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("buildings/{buildingId:guid}/floors")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<FloorDto>>>> GetFloorsForBuilding(Guid buildingId)
    {
        var response = await _mapService.GetFloorsForBuildingAsync(buildingId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("buildings/{buildingId:guid}/floors")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<FloorDto>>> CreateFloorForBuilding(
        Guid buildingId,
        [FromForm] int levelNumber,
        [FromForm] IFormFile floorplanFile)
    {
        // Bind primitives + file directly. A single [FromForm] DTO uses the parameter name as a prefix
        // (`request.*`), so multipart clients sending `LevelNumber` / `FloorplanFile` saw `FloorplanFile` null.
        var request = new CreateFloorRequest
        {
            LevelNumber = levelNumber,
            FloorplanFile = floorplanFile
        };
        var response = await _mapService.CreateFloorForBuildingAsync(buildingId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("floors/{floorId:guid}/pins")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<MapPinDto>>> CreatePinForFloor(
        Guid floorId,
        [FromBody] CreateMapPinRequest request)
    {
        var response = await _mapService.CreatePinForFloorAsync(floorId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
