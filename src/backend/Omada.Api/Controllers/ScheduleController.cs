using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public ScheduleController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    /// <summary>Availability for a user: Offline (not in org), Busy (hosting an event now), or Free.</summary>
    [HttpGet("status")]
    [HasPermission(WidgetKeys.Users, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<ScheduleUserStatusDto>>> GetStatus([FromQuery] Guid userId)
    {
        var response = await _scheduleService.GetUserScheduleStatusAsync(userId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<ScheduleItemDto>>>> GetSchedule(
        [FromQuery] DateTime? date, 
        [FromQuery] string viewMode = "day", 
        [FromQuery] Guid? hostId = null,    
        [FromQuery] Guid? groupId = null,
        [FromQuery] Guid? roomId = null,
        [FromQuery] Guid? eventTypeId = null,
        [FromQuery] bool myScheduleOnly = true,
        [FromQuery] bool publicOnly = false)
    {
        var anchorDate = date ?? DateTime.UtcNow;
        var from = anchorDate.Date;
        var to = viewMode.ToLower() == "week" ? from.AddDays(7) : from.AddDays(1);

        var request = new GetScheduleRequest
        {
            FromDate = from, ToDate = to, HostId = hostId, GroupId = groupId,
            RoomId = roomId, EventTypeId = eventTypeId,
            MyScheduleOnly = myScheduleOnly,
            PublicOnly = publicOnly
        };

        var response = await _scheduleService.GetScheduleAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>Other sections with the same subject and event type in the same week as <paramref name="instanceDate"/>.</summary>
    [HttpGet("alternatives")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<ScheduleItemDto>>>> GetAlternativeClassTimes(
        [FromQuery] Guid eventId,
        [FromQuery] DateTime instanceDate)
    {
        var response = await _scheduleService.GetAlternativeClassTimesAsync(eventId, instanceDate);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<ScheduleItemDto>>> CreateEvent([FromBody] CreateEventRequest request)
    {
        var response = await _scheduleService.CreateEventAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // 🚀 NEW: Get Dynamic Event Types
    [HttpGet("types")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<EventTypeDto>>>> GetEventTypes()
    {
        // Now returns dynamic data from DB
        var response = await _scheduleService.GetEventTypesAsync();
        return Ok(response);
    }

    // 🚀 UPDATE
    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<ScheduleItemDto>>> UpdateEvent(Guid id, [FromBody] CreateEventRequest request)
    {
        var response = await _scheduleService.UpdateEventAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // 🚀 NEW: Update Attendance (Join/Skip a specific class, RSVP, swaps)
    [HttpPost("{id:guid}/attendance")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<bool>>> UpdateAttendance(Guid id, [FromBody] UpdateAttendanceRequest request)
    {
        var response = await _scheduleService.UpdateAttendanceAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // 🚀 DELETE
    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<bool>>> DeleteEvent(Guid id)
    {
        var response = await _scheduleService.DeleteEventAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // 🚀 CANCEL INSTANCE
    [HttpDelete("{id:guid}/instance")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<bool>>> CancelEventInstance(
        Guid id, 
        [FromQuery] DateTime originalDate)
    {
        // originalDate is passed from frontend (the start time of the specific instance to cancel)
        var response = await _scheduleService.CancelEventInstanceAsync(id, originalDate);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("hosts")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<HostDto>>>> SearchHosts([FromQuery] string query)
    {
        var response = await _scheduleService.SearchHostsAsync(query);
        return Ok(response);
    }

    /// <summary>Free/busy intervals for a colleague (no meeting titles).</summary>
    [HttpGet("busy")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<BusyIntervalDto>>>> GetBusyIntervals(
        [FromQuery] Guid userId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        var response = await _scheduleService.GetBusyIntervalsAsync(userId, from, to);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{id:guid}/propose-time")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<bool>>> ProposeMeetingTime(Guid id, [FromBody] ProposeMeetingTimeRequest request)
    {
        var response = await _scheduleService.ProposeMeetingTimeAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}