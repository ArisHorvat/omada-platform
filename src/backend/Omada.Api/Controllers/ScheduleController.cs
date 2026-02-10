using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;
    private readonly IUserContext _userContext;

    public ScheduleController(IScheduleService scheduleService, IUserContext userContext)
    {
        _scheduleService = scheduleService;
        _userContext = userContext;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ServiceResponse<IEnumerable<ScheduleItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ServiceResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSchedule(
        [FromQuery] DateTime? date, 
        [FromQuery] string viewMode = "day", 
        [FromQuery] Guid? targetId = null, 
        [FromQuery] int targetType = 0)
    {
        try 
        {
            // 1. Get Context from JWT (via UserContext helper)
            var orgId = _userContext.OrganizationId;
            var currentUserId = _userContext.UserId;

            // 2. Calculate Date Range
            var anchorDate = date ?? DateTime.UtcNow;
            var from = anchorDate.Date;
            var to = viewMode.ToLower() == "week" ? from.AddDays(7) : from.AddDays(1);

            var request = new ScheduleRequestDto
            {
                FromDate = from,
                ToDate = to,
                TargetId = targetId ?? currentUserId,
                TargetType = targetType
            };

            // 3. Call Service (Returns Result<IEnumerable<ScheduleItemDto>>)
            var result = await _scheduleService.GetScheduleAsync(orgId, request);

            // 4. Handle Failure
            if (result.IsFailure)
            {
                return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.OperationFailed, result.Error)));
            }

            // 5. Handle Success
            return Ok(new ServiceResponse<IEnumerable<ScheduleItemDto>>(true, result.Value));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "Your session has expired.")));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }
}