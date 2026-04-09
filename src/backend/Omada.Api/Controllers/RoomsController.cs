using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Rooms, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<RoomDto>>>> GetAll()
    {
        var response = await _roomService.GetAllRoomsAsync();
        return Ok(response);
    }

    [HttpGet("search")]
    [HasPermission(WidgetKeys.Rooms, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<RoomDto>>>> Search([FromQuery] RoomSearchRequest request)
    {
        var response = await _roomService.SearchRoomsAsync(request);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServiceResponse<RoomDto>>> GetById(Guid id)
    {
        var response = await _roomService.GetRoomByIdAsync(id);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Rooms, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<RoomDto>>> Create([FromBody] CreateRoomRequest request)
    {
        var response = await _roomService.CreateRoomAsync(request);
        return response.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response) : BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Rooms, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<RoomDto>>> Update(Guid id, [FromBody] CreateRoomRequest request)
    {
        var response = await _roomService.UpdateRoomAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Rooms, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid id)
    {
        var response = await _roomService.DeleteRoomAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{id:guid}/book")]
    [HasPermission(WidgetKeys.Rooms, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<RoomBookingDto>>> Book(Guid id, [FromBody] BookRoomRequest request)
    {
        var response = await _roomService.BookRoomAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}