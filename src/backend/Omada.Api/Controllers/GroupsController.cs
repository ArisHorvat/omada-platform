using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
    {
        var orgIdClaim = User.FindFirst("organizationId")?.Value;
        if (string.IsNullOrEmpty(orgIdClaim)) return Unauthorized();
        var orgId = Guid.Parse(orgIdClaim);

        var request = new CreateGroupRequest(orgId, dto.Name, dto.Type, dto.ManagerId, dto.ParentGroupId, dto.ScheduleConfig);
        var result = await _groupService.CreateGroupAsync(request);

        if (result.IsFailure) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpGet("attendance-config")]
    public async Task<IActionResult> GetAttendanceConfig()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var orgId = Guid.Parse(User.FindFirst("organizationId")?.Value!);

        var config = await _groupService.GetAttendanceConfigAsync(userId, orgId);
        return Ok(config);
    }
}

public class CreateGroupDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "class";
    public Guid? ManagerId { get; set; }
    public Guid? ParentGroupId { get; set; }
    public string? ScheduleConfig { get; set; }
}