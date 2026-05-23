using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IOrganizationAdminService _adminService;

    public AdminController(IOrganizationAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("widgets")]
    [HasPermission(WidgetKeys.Settings, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<WidgetCatalogItemDto>>>> GetWidgets()
    {
        var response = await _adminService.GetWidgetCatalogAsync();
        return Ok(response);
    }
}
