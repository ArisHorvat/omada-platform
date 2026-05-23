using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/super-admin")]
[Authorize(Roles = "SuperAdmin,Super Admin")]
public class SuperAdminController : ControllerBase
{
    private readonly IOrganizationService _organizationService;
    private readonly IAuditLogService _auditLogService;

    public SuperAdminController(
        IOrganizationService organizationService,
        IAuditLogService auditLogService)
    {
        _organizationService = organizationService;
        _auditLogService = auditLogService;
    }

    [HttpGet("organizations")]
    public async Task<ActionResult<ServiceResponse<PagedResponse<OrganizationDetailsDto>>>> GetOrganizations(
        [FromQuery] PagedRequest request)
    {
        var response = await _organizationService.GetAllAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("organizations/{id:guid}")]
    public async Task<ActionResult<ServiceResponse<OrganizationDetailsDto>>> GetOrganization(Guid id)
    {
        var response = await _organizationService.GetByIdAsync(id);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpDelete("organizations/{id:guid}")]
    public async Task<ActionResult<ServiceResponse<bool>>> DeleteOrganization(Guid id)
    {
        var response = await _organizationService.DeleteOrganizationAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<ServiceResponse<PagedResponse<AuditLogDto>>>> GetAuditLogs(
        [FromQuery] PagedRequest request,
        [FromQuery] Guid? organizationId)
    {
        var response = await _auditLogService.GetPlatformWideAsync(request, organizationId);
        return Ok(response);
    }
}
