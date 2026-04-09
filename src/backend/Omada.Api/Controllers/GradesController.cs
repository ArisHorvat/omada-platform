using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
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
    public async Task<ActionResult<ServiceResponse<MyGradesResponse>>> GetMyGrades(CancellationToken cancellationToken)
    {
        var response = await _gradeService.GetMyGradesAsync(cancellationToken);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }
}
