using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Services.Interfaces;
using Omada.Api.WebSocketHandlers;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Abstractions;
using Omada.Api.Entities;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;
    private readonly IWebSocketHandler _webSocketHandler;
    private readonly ILogger<OrganizationsController> _logger;

    public OrganizationsController(IOrganizationService organizationService, IWebSocketHandler webSocketHandler, ILogger<OrganizationsController> logger)
    {
        _organizationService = organizationService;
        _webSocketHandler = webSocketHandler;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ServiceResponse<Organization>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ServiceResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(RegisterOrganizationRequest request)
    {
        var result = await _organizationService.CreateOrganizationAsync(request);

        if (result.IsFailure)
        {
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.OperationFailed, result.Error)));
        }

        return Ok(new ServiceResponse<Organization>(true, result.Value));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ServiceResponse<OrganizationDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ServiceResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _organizationService.GetByIdAsync(id);

        if (result.IsFailure)
        {
            return NotFound(new ServiceResponse(false, new AppError(ErrorCodes.NotFound, result.Error)));
        }

        return Ok(new ServiceResponse<OrganizationDetailsDto>(true, result.Value));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ServiceResponse<IEnumerable<OrganizationDetailsDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _organizationService.GetAllAsync();
        
        if (result.IsFailure)
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.OperationFailed, result.Error)));

        return Ok(new ServiceResponse<IEnumerable<OrganizationDetailsDto>>(true, result.Value));
    }

    [HttpGet("/ws/organizations")]
    public async Task GetWebSocket([FromQuery] Guid orgId)
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await _webSocketHandler.HandleAsync(webSocket, orgId);
        }
        else
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
}