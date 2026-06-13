using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/Offerings")]
[Authorize]
public class OfferingsController : ControllerBase
{
    private readonly ICourseOfferingService _offeringService;
    private readonly IGradebookService _gradebookService;

    public OfferingsController(ICourseOfferingService offeringService, IGradebookService gradebookService)
    {
        _offeringService = offeringService;
        _gradebookService = gradebookService;
    }

    [HttpGet("current-period")]
    [HasPermission(WidgetKeys.Schedule, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<CurrentOrganizationPeriodDto>>> GetCurrentPeriod()
    {
        var response = await _offeringService.GetCurrentPeriodAsync();
        return Ok(response);
    }

    [HttpGet("periods")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<OrganizationPeriodDto>>>> GetPeriods()
    {
        var response = await _offeringService.GetOrganizationPeriodsAsync();
        return Ok(response);
    }

    [HttpGet("assignable")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<OfferingPickerItemDto>>>> GetAssignable(
        [FromQuery] Guid? periodId)
    {
        var response = await _offeringService.GetAssignableOfferingsAsync(periodId);
        return Ok(response);
    }

    [HttpGet("my")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<OfferingPickerItemDto>>>> GetMyEnrollments(
        [FromQuery] Guid? periodId)
    {
        var response = await _offeringService.GetMyEnrollmentsAsync(periodId);
        return Ok(response);
    }

    [HttpGet("{periodId:guid}/{offeringId:guid}/gradebook")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<OfferingGradebookDto>>> GetGradebook(
        Guid periodId,
        Guid offeringId,
        [FromQuery] Guid? cohortGroupId)
    {
        var response = await _gradebookService.GetOfferingGradebookAsync(periodId, offeringId, cohortGroupId);
        return Ok(response);
    }

    [HttpGet("{periodId:guid}/{offeringId:guid}/students/{studentUserId:guid}/grade-breakdown")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<StudentOfferingGradeBreakdownDto>>> GetStudentGradeBreakdown(
        Guid periodId,
        Guid offeringId,
        Guid studentUserId)
    {
        var response = await _gradebookService.GetStudentBreakdownAsync(periodId, offeringId, studentUserId);
        return Ok(response);
    }
}
