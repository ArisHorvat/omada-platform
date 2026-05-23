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
}
