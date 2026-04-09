using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventTypesController : ControllerBase
{
    private readonly IEventTypeService _service;

    public EventTypesController(IEventTypeService service)
    {
        _service = service;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<EventTypeDto>>>> GetAll()
    {
        var response = await _service.GetAllAsync();
        return Ok(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<EventTypeDto>>> Create([FromBody] CreateEventTypeRequest request)
    {
        var response = await _service.CreateAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<EventTypeDto>>> Update(Guid id, [FromBody] CreateEventTypeRequest request)
    {
        var response = await _service.UpdateAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid id)
    {
        var response = await _service.DeleteAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}