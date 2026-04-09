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

    [HttpGet]
    public async Task<ActionResult<ServiceResponse<PagedResponse<OrganizationDetailsDto>>>> GetAll([FromQuery] PagedRequest request)
    {
        var response = await _organizationService.GetAllAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}