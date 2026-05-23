using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/Organizations/current")]
[Authorize]
public class OrganizationAdminController : ControllerBase
{
    private readonly IOrganizationAdminService _adminService;

    public OrganizationAdminController(IOrganizationAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<OrganizationDetailsDto>>> GetCurrent()
    {
        var response = await _adminService.GetCurrentAsync();
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPut]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<OrganizationDetailsDto>>> UpdateCurrent(
        [FromBody] UpdateCurrentOrganizationRequest request)
    {
        var response = await _adminService.UpdateCurrentAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("invite-code/regenerate")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<RegenerateInviteCodeResponse>>> RegenerateInviteCode()
    {
        var response = await _adminService.RegenerateInviteCodeAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("members")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<OrganizationMemberDto>>>> GetMembers(
        [FromQuery] PagedRequest request,
        [FromQuery] string? q,
        [FromQuery] Guid? roleId)
    {
        var response = await _adminService.GetMembersAsync(request, q, roleId);
        return Ok(response);
    }

    [HttpPost("members/invite")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<int>>> InviteMembers([FromBody] InviteMembersRequest request)
    {
        var response = await _adminService.InviteMembersAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("members/{userId:guid}")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<OrganizationMemberDto>>> UpdateMember(
        Guid userId,
        [FromBody] UpdateOrganizationMemberRequest request)
    {
        var response = await _adminService.UpdateMemberAsync(userId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("roles")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<OrganizationRoleDto>>>> GetRoles()
    {
        var response = await _adminService.GetRolesAsync();
        return Ok(response);
    }

    [HttpGet("roles/{roleId:guid}")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<OrganizationRoleDetailDto>>> GetRoleDetail(Guid roleId)
    {
        var response = await _adminService.GetRoleDetailAsync(roleId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost("roles")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<OrganizationRoleDto>>> CreateRole(
        [FromBody] CreateOrganizationRoleRequest request)
    {
        var response = await _adminService.CreateRoleAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("roles/{roleId:guid}")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<OrganizationRoleDto>>> UpdateRole(
        Guid roleId,
        [FromBody] UpdateOrganizationRoleRequest request)
    {
        var response = await _adminService.UpdateRoleAsync(roleId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("roles/{roleId:guid}")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> DeleteRole(Guid roleId)
    {
        var response = await _adminService.DeleteRoleAsync(roleId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("roles/{roleId:guid}/permissions")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<OrganizationRoleDetailDto>>> UpdateRolePermissions(
        Guid roleId,
        [FromBody] UpdateRolePermissionsRequest request)
    {
        var response = await _adminService.UpdateRolePermissionsAsync(roleId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("periods")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<OrganizationPeriodDto>>>> GetPeriods()
    {
        var response = await _adminService.GetPeriodsAsync();
        return Ok(response);
    }

    [HttpPost("periods")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<OrganizationPeriodDto>>> CreatePeriod(
        [FromBody] CreateOrganizationPeriodRequest request)
    {
        var response = await _adminService.CreatePeriodAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("periods/{periodId:guid}")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<OrganizationPeriodDto>>> UpdatePeriod(
        Guid periodId,
        [FromBody] UpdateOrganizationPeriodRequest request)
    {
        var response = await _adminService.UpdatePeriodAsync(periodId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("periods/{periodId:guid}")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> DeletePeriod(Guid periodId)
    {
        var response = await _adminService.DeletePeriodAsync(periodId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("enabled-widgets")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<OrganizationDetailsDto>>> UpdateEnabledWidgets(
        [FromBody] UpdateOrganizationEnabledWidgetsRequest request)
    {
        var response = await _adminService.UpdateEnabledWidgetsAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("audit-logs")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<AuditLogDto>>>> GetAuditLogs(
        [FromQuery] PagedRequest request)
    {
        var response = await _adminService.GetAuditLogsAsync(request);
        return Ok(response);
    }
}
