using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Groups;
using System.Collections.Generic;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<GroupDto>>> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var response = await _groupService.CreateGroupAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("attendance-config")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<AttendanceConfigDto>>> GetAttendanceConfig()
    {
        var response = await _groupService.GetAttendanceConfigAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("departments")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<DepartmentSummaryDto>>>> GetDepartments()
    {
        var response = await _groupService.GetDepartmentsAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}