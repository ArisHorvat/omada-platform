using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Organizations;
using Omada.Api.DTOs.Common;
using Omada.Api.Abstractions;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationsController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    [HttpPost]
    public async Task<ActionResult<ServiceResponse<OrganizationDetailsDto>>> Create(RegisterOrganizationRequest request)
    {
        var response = await _organizationService.CreateOrganizationAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServiceResponse<OrganizationDetailsDto>>> GetById(Guid id)
    {
        var response = await _organizationService.GetByIdAsync(id);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpGet("invite/{inviteCode}")]
    public async Task<ActionResult<ServiceResponse<OrganizationInvitePreviewDto>>> GetInvitePreview(string inviteCode)
    {
        var response = await _organizationService.GetInvitePreviewAsync(inviteCode);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Super Admin")]
    public async Task<ActionResult<ServiceResponse<PagedResponse<OrganizationDetailsDto>>>> GetAll([FromQuery] PagedRequest request)
    {
        var response = await _organizationService.GetAllAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}