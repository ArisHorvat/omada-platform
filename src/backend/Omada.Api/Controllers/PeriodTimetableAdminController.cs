using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.Infrastructure;
using Omada.Api.DTOs.Offerings;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/Organizations/current/periods/{periodId:guid}")]
[Authorize]
public class PeriodTimetableAdminController : ControllerBase
{
    [HttpPost("preview-timetable")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<PreviewTimetableResultDto>>> PreviewTimetable(
        Guid periodId,
        [FromBody] PreviewTimetableRequest request,
        [FromServices] IOfferingTimetableService timetableService,
        CancellationToken cancellationToken)
    {
        var response = await timetableService.PreviewTimetableAsync(periodId, request, cancellationToken);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("timetable-publish-status")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<TimetablePublishStatusResultDto>>> GetPublishStatus(
        Guid periodId,
        [FromBody] TimetablePublishStatusRequest request,
        [FromServices] IOfferingTimetableService timetableService,
        CancellationToken cancellationToken)
    {
        var response = await timetableService.GetPublishStatusAsync(periodId, request, cancellationToken);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("bulk-publish-timetable")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<BulkPublishTimetableResultDto>>> BulkPublishTimetable(
        Guid periodId,
        [FromBody] BulkPublishTimetableRequest request,
        [FromServices] IOfferingTimetableService timetableService,
        CancellationToken cancellationToken)
    {
        var response = await timetableService.BulkPublishTimetableAsync(periodId, request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("member-schedule-preview")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<MemberSchedulePreviewResultDto>>> MemberSchedulePreview(
        Guid periodId,
        [FromBody] MemberSchedulePreviewRequest request,
        [FromServices] IScheduleService scheduleService,
        [FromServices] ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var clientOffset = request.ClientUtcOffsetMinutes ?? 0;
        var weekStart = request.WeekStartDate.Date;
        var weekEnd = weekStart.AddDays(7);
        var from = ScheduleWallClock.ToUtcInstant(weekStart, 0, 0, clientOffset);
        var to = ScheduleWallClock.ToUtcInstant(weekEnd, 0, 0, clientOffset);

        var schedule = await scheduleService.GetScheduleForUserAsync(request.UserId, new GetScheduleRequest
        {
            FromDate = from,
            ToDate = to,
            PeriodId = periodId,
            MyScheduleOnly = true
        });

        if (!schedule.IsSuccess || schedule.Data == null)
            return BadRequest(schedule);

        var user = await context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        var displayName = user == null ? null : $"{user.FirstName} {user.LastName}".Trim();

        var sessions = schedule.Data
            .OrderBy(s => s.StartTime)
            .Select(s => new MemberSchedulePreviewItemDto
            {
                EventId = s.Id,
                Title = s.Title,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                TypeName = s.TypeName,
                HostName = s.HostName,
                RoomName = s.RoomName,
                OfferingName = s.OfferingName,
                CohortGroupName = s.CohortGroupName
            })
            .ToList();

        return Ok(new ServiceResponse<MemberSchedulePreviewResultDto>(true, new MemberSchedulePreviewResultDto
        {
            WeekStartDate = weekStart,
            WeekEndDate = weekEnd,
            UserId = request.UserId,
            UserDisplayName = displayName,
            SessionCount = sessions.Count,
            Sessions = sessions
        }));
    }
}
