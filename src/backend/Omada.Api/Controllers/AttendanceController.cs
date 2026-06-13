using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using Omada.Api.Abstractions;

using Omada.Api.DTOs.Attendance;

using Omada.Api.DTOs.Common;

using Omada.Api.Entities;

using Omada.Api.Infrastructure;

using Omada.Api.Services.Interfaces;



namespace Omada.Api.Controllers;



[ApiController]

[Route("api/[controller]")]

[Authorize]

public class AttendanceController : ControllerBase

{

    private readonly IAttendanceService _attendanceService;



    public AttendanceController(IAttendanceService attendanceService)

    {

        _attendanceService = attendanceService;

    }



    /// <summary>

    /// Authenticated user’s attendance summary, recent records, next session, and managed sessions (teachers).

    /// </summary>

    [HttpGet("me")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.View))]

    public async Task<ActionResult<ServiceResponse<MyAttendanceResponse>>> GetMyAttendance(

        [FromQuery] Guid? groupId,

        [FromQuery] int? days,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.GetMyAttendanceAsync(groupId, days, cancellationToken);

        return response.IsSuccess ? Ok(response) : StatusCode(500, response);

    }



    /// <summary>Student attendance breakdown by enrolled offering and activity type.</summary>

    [HttpGet("my-offerings")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.View))]

    public async Task<ActionResult<ServiceResponse<MyOfferingAttendanceResponse>>> GetMyOfferingAttendance(

        [FromQuery] Guid? periodId,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.GetMyOfferingAttendanceAsync(periodId, cancellationToken);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    /// <summary>Session roster for teachers (enrolled students + current status).</summary>

    [HttpGet("sessions/{eventId:guid}/roster")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.Edit))]

    public async Task<ActionResult<ServiceResponse<AttendanceSessionRosterDto>>> GetSessionRoster(

        Guid eventId,

        [FromQuery] DateTime instanceDate,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.GetSessionRosterAsync(eventId, instanceDate, cancellationToken);

        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)

            return StatusCode(403, response);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    /// <summary>Bulk mark attendance for a session roster.</summary>

    [HttpPost("sessions/{eventId:guid}/roster")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.Edit))]

    public async Task<ActionResult<ServiceResponse<bool>>> BulkMarkSessionRoster(

        Guid eventId,

        [FromBody] BulkMarkAttendanceRequest request,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.BulkMarkSessionRosterAsync(eventId, request, cancellationToken);

        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)

            return StatusCode(403, response);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    [HttpGet("admin/records")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.Edit))]

    public async Task<ActionResult<ServiceResponse<PagedResponse<AttendanceAdminRecordDto>>>> GetAdminRecords(

        [FromQuery] PagedRequest request,

        [FromQuery] Guid? userId,

        [FromQuery] Guid? groupId,

        [FromQuery] int? days,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.GetAdminRecordsAsync(request, userId, groupId, days, cancellationToken);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    /// <summary>

    /// Staff records attendance for a member (manual roll or after Digital ID scan).

    /// </summary>

    [HttpPost("record")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.Edit))]

    public async Task<ActionResult<ServiceResponse<bool>>> RecordMemberAttendance(

        [FromBody] RecordMemberAttendanceRequest request,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.RecordMemberAttendanceAsync(request, cancellationToken);

        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)

            return StatusCode(403, response);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    [HttpGet("work-time/today")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.View))]

    public async Task<ActionResult<ServiceResponse<WorkTimeTodayResponse>>> GetWorkTime(

        [FromQuery] int days = 14,

        CancellationToken cancellationToken = default)

    {

        var response = await _attendanceService.GetWorkTimeAsync(days, cancellationToken);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    [HttpPost("work-time/clock-in")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.View))]

    public async Task<ActionResult<ServiceResponse<WorkTimeEntryDto>>> ClockIn(CancellationToken cancellationToken)

    {

        var response = await _attendanceService.ClockInAsync(cancellationToken);

        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Conflict)

            return Conflict(response);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    [HttpPost("work-time/clock-out")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.View))]

    public async Task<ActionResult<ServiceResponse<WorkTimeEntryDto>>> ClockOut(CancellationToken cancellationToken)

    {

        var response = await _attendanceService.ClockOutAsync(cancellationToken);

        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Conflict)

            return Conflict(response);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }



    [HttpPut("work-time/today/break")]

    [HasPermission(WidgetKeys.Attendance, nameof(AccessLevel.View))]

    public async Task<ActionResult<ServiceResponse<WorkTimeEntryDto>>> SetTodayBreak(

        [FromBody] SetWorkBreakRequest request,

        CancellationToken cancellationToken)

    {

        var response = await _attendanceService.SetTodayBreakAsync(request, cancellationToken);

        return response.IsSuccess ? Ok(response) : BadRequest(response);

    }

}

