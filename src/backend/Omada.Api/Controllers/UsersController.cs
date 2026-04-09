using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Users;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IDigitalIdService _digitalIdService;

    public UsersController(IUserService userService, IDigitalIdService digitalIdService)
    {
        _userService = userService;
        _digitalIdService = digitalIdService;
    }

    /// <summary>Digital ID card payload + short-lived signed QR token for the current org.</summary>
    [HttpGet("me/digital-id")]
    [HasPermission(WidgetKeys.DigitalId, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<DigitalIdDto>>> GetMyDigitalId()
    {
        var response = await _digitalIdService.GetMyDigitalIdAsync();
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("me")]
    public async Task<ActionResult<ServiceResponse<UserProfileDto>>> GetMe()
    {
        var response = await _userService.GetUserProfileAsync();

        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPut("me")]
    public async Task<ActionResult<ServiceResponse<string>>> UpdateMe([FromBody] UpdateMyProfileRequest request)
    {
        var response = await _userService.UpdateMyProfileAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("me")]
    public async Task<ActionResult<ServiceResponse<string>>> DeleteMe()
    {
        var response = await _userService.SoftDeleteMyAccountAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("me/export")]
    public async Task<IActionResult> ExportMyData()
    {
        var response = await _userService.ExportMyDataJsonAsync();
        if (!response.IsSuccess || response.Data == null)
            return NotFound(response);

        var fileName = $"omada-user-export-{DateTime.UtcNow:yyyyMMddHHmmss}.json";
        return File(response.Data, "application/json; charset=utf-8", fileName);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ServiceResponse<string>>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var response = await _userService.UpdateProfileAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("security")]
    public async Task<ActionResult<ServiceResponse<string>>> UpdateSecurity([FromBody] UpdateSecurityRequest request)
    {
        var response = await _userService.UpdateSecurityAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("directory")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<UserDirectoryItemDto>>>> GetDirectory(
        [FromQuery] PagedRequest request,
        [FromQuery] string? q,
        [FromQuery] string? role,
        [FromQuery] Guid? managerId,
        [FromQuery] Guid? departmentId)
    {
        var response = await _userService.GetUserDirectoryAsync(request, q, role, managerId, departmentId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{id:guid}")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<UserDeepProfileDto>>> GetById([FromRoute] Guid id)
    {
        var response = await _userService.GetUserDeepProfileAsync(id);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }
}