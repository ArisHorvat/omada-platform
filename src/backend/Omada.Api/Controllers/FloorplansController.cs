using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Maps;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/floorplans")]
[Authorize]
public class FloorplansController : ControllerBase
{
    private readonly IFloorplanProcessingService _floorplanProcessingService;

    public FloorplansController(IFloorplanProcessingService floorplanProcessingService)
    {
        _floorplanProcessingService = floorplanProcessingService;
    }

    /// <summary>Upload a floorplan image; runs AI processing and stores GeoJSON for the floor.</summary>
    [HttpPost("upload")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<FloorplanDto>>> Upload(
        [FromForm] UploadFloorplanRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _floorplanProcessingService.UploadAndProcessAsync(request.FloorId, request.File, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{id:guid}")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<FloorplanDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _floorplanProcessingService.GetByIdAsync(id, cancellationToken);
        if (response.IsSuccess)
            return Ok(response);
        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return BadRequest(response);
    }

    /// <summary>Replace GeoJSON for a floorplan (manual corrections; does not call AI).</summary>
    [HttpPut("{id:guid}/geojson")]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<FloorplanDto>>> UpdateGeoJson(
        Guid id,
        [FromBody] UpdateFloorplanGeoJsonRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _floorplanProcessingService.UpdateGeoJsonAsync(id, request.GeoJsonData, cancellationToken);
        if (response.IsSuccess)
            return Ok(response);
        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return BadRequest(response);
    }
}
