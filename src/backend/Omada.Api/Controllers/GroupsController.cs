using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Groups;
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

    [HttpGet("tree")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<GroupTreeNodeDto>>>> GetTree()
    {
        var response = await _groupService.GetGroupTreeAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

  /// <summary>Groups the current user may attach to schedule events, assignments, or grades (membership-scoped).</summary>
    [HttpGet("assignable")]
    [Authorize]
    public async Task<ActionResult<ServiceResponse<IEnumerable<GroupPickerItemDto>>>> GetAssignable(
        [FromQuery] string context = "schedule")
    {
        var response = await _groupService.GetAssignableGroupsAsync(context);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("types")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<GroupTypeOptionDto>>>> GetTypes()
    {
        var response = await _groupService.GetGroupTypeCatalogAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{id:guid}")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<GroupDetailDto>>> GetById([FromRoute] Guid id)
    {
        var response = await _groupService.GetGroupByIdAsync(id);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<GroupDto>>> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var response = await _groupService.CreateGroupAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<GroupDto>>> UpdateGroup(
        [FromRoute] Guid id,
        [FromBody] UpdateGroupRequest request)
    {
        var response = await _groupService.UpdateGroupAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> DeleteGroup([FromRoute] Guid id)
    {
        var response = await _groupService.DeleteGroupAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{id:guid}/members")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<GroupMemberDto>>>> GetMembers(
        [FromRoute] Guid id,
        [FromQuery] PagedRequest request,
        [FromQuery] string? q)
    {
        var response = await _groupService.GetGroupMembersAsync(id, request, q);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost("{id:guid}/members")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<int>>> AddMembers(
        [FromRoute] Guid id,
        [FromBody] AddGroupMembersRequest request)
    {
        var response = await _groupService.AddGroupMembersAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<bool>>> RemoveMember(
        [FromRoute] Guid id,
        [FromRoute] Guid userId)
    {
        var response = await _groupService.RemoveGroupMemberAsync(id, userId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost("members/move")]
    [HasPermission(WidgetKeys.Groups, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<int>>> MoveMembers([FromBody] MoveGroupMembersRequest request)
    {
        var response = await _groupService.MoveGroupMembersAsync(request);
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
