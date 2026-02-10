using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.Entities;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Groups; 

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
    [ProducesResponseType(typeof(ServiceResponse<Group>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
    {
        try 
        {
            var orgIdClaim = User.FindFirst("OrganizationId")?.Value;
            if (string.IsNullOrEmpty(orgIdClaim)) 
                return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "Missing Organization Context")));
            
            var orgId = Guid.Parse(orgIdClaim);

            var request = new CreateGroupRequest
            {
                OrganizationId = orgId,
                Name = dto.Name,
                Type = dto.Type,
                ManagerId = dto.ManagerId,
                ParentGroupId = dto.ParentGroupId,
                ScheduleConfig = dto.ScheduleConfig
            };
            
            var result = await _groupService.CreateGroupAsync(request);

            if (result.IsFailure)
            {
                return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, result.Error)));
            }

            return Ok(new ServiceResponse<Group>(true, result.Value));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpGet("attendance-config")]
    [ProducesResponseType(typeof(ServiceResponse<AttendanceConfigDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttendanceConfig()
    {
        try 
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var orgId = Guid.Parse(User.FindFirst("OrganizationId")?.Value!);

            var result = await _groupService.GetAttendanceConfigAsync(userId, orgId);

            if (result.IsFailure)
            {
                return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.OperationFailed, result.Error)));
            }

            return Ok(new ServiceResponse<AttendanceConfigDto>(true, result.Value));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }
}
