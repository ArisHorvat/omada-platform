using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Grades;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GradesController : ControllerBase
{
    private readonly IGradeService _gradeService;

    public GradesController(IGradeService gradeService)
    {
        _gradeService = gradeService;
    }

    /// <summary>
    /// Returns the authenticated user’s grades for the active organization and the current weighted GPA.
    /// User identity is taken only from the JWT; no user id is accepted from the client.
    /// </summary>
    [HttpGet("me")]
    [HasPermission(WidgetKeys.Grades, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<MyGradesResponse>>> GetMyGrades(
        [FromQuery] Guid? groupId,
        CancellationToken cancellationToken)
    {
        var response = await _gradeService.GetMyGradesAsync(groupId, cancellationToken);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpGet("admin")]
    [HasPermission(WidgetKeys.Grades, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<GradeAdminDto>>>> GetAdminGrades(
        [FromQuery] PagedRequest request,
        [FromQuery] Guid? userId,
        [FromQuery] string? semester,
        [FromQuery] Guid? groupId,
        CancellationToken cancellationToken)
    {
        var response = await _gradeService.GetAdminGradesAsync(request, userId, semester, groupId, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Grades, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<GradeAdminDto>>> CreateGrade(
        [FromBody] CreateGradeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _gradeService.CreateGradeAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Grades, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<GradeAdminDto>>> UpdateGrade(
        Guid id,
        [FromBody] UpdateGradeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _gradeService.UpdateGradeAsync(id, request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Grades, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> DeleteGrade(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await _gradeService.DeleteGradeAsync(id, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
