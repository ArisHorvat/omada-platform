using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Services.Interfaces;
using Omada.Api.WebSocketHandlers;

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
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreateOrganizationRequest request)
    {
        _logger.LogInformation("Received request to create organization: {Name}", request.Name);
        var result = await _organizationService.CreateOrganizationAsync(request);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to create organization: {Error}", result.Error);
            return BadRequest(new { Error = result.Error });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    // [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateOrganizationRequest request)
    {
        _logger.LogInformation("Received request to update organization: {Id}", id);
        var result = await _organizationService.UpdateOrganizationAsync(id, request);
        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to update organization {Id}: {Error}", id, result.Error);
            return result.Error!.Contains("not found") ? NotFound() : BadRequest(new { Error = result.Error });
        }
        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    // [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Received request to delete organization: {Id}", id);
        var result = await _organizationService.DeleteOrganizationAsync(id);
        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to delete organization {Id}: {Error}", id, result.Error);
            return NotFound();
        }

        return NoContent();
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        _logger.LogInformation("Fetching organization details for: {Id}", id);
        var organization = await _organizationService.GetByIdAsync(id);
        if (organization == null)
        {
            _logger.LogWarning("Organization not found: {Id}", id);
            return NotFound();
        }

        return Ok(organization);
    }

    [HttpGet]
    // [Authorize(Roles = "SuperAdmin")] // We will enable this after setting up auth middleware
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("Fetching all organizations");
        var organizations = await _organizationService.GetAllAsync();
        return Ok(organizations);
    }

    [HttpGet("/ws/organizations")]
    public async Task GetWebSocket()
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            _logger.LogInformation("Accepting WebSocket connection");
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await _webSocketHandler.HandleAsync(webSocket);
        }
        else
        {
            _logger.LogWarning("Invalid WebSocket request");
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
}
