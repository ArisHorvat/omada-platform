using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/Organizations/current/periods/{periodId:guid}/offerings")]
[Authorize]
public class CourseOfferingsAdminController : ControllerBase
{
    private readonly ICourseOfferingService _offeringService;

    public CourseOfferingsAdminController(ICourseOfferingService offeringService)
    {
        _offeringService = offeringService;
    }

    [HttpGet]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<IEnumerable<CourseOfferingDto>>>> GetOfferings(Guid periodId)
    {
        var response = await _offeringService.GetOfferingsForPeriodAsync(periodId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<CourseOfferingDto>>> Create(
        Guid periodId,
        [FromBody] CreateCourseOfferingRequest request)
    {
        var response = await _offeringService.CreateOfferingAsync(periodId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{offeringId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<CourseOfferingDto>>> Update(
        Guid periodId,
        Guid offeringId,
        [FromBody] UpdateCourseOfferingRequest request)
    {
        var response = await _offeringService.UpdateOfferingAsync(periodId, offeringId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{offeringId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid periodId, Guid offeringId)
    {
        var response = await _offeringService.DeleteOfferingAsync(periodId, offeringId);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{offeringId:guid}/enrollments")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<IEnumerable<OfferingEnrollmentDto>>>> GetEnrollments(
        Guid periodId,
        Guid offeringId)
    {
        var response = await _offeringService.GetEnrollmentsAsync(periodId, offeringId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost("{offeringId:guid}/enroll-cohort")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<int>>> EnrollCohort(
        Guid periodId,
        Guid offeringId,
        [FromBody] EnrollCohortRequest request)
    {
        var response = await _offeringService.EnrollCohortAsync(periodId, offeringId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{offeringId:guid}/enroll-program-cohorts")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<int>>> EnrollProgramCohorts(
        Guid periodId,
        Guid offeringId,
        [FromBody] EnrollProgramCohortsRequest request)
    {
        var response = await _offeringService.EnrollProgramCohortsAsync(periodId, offeringId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{offeringId:guid}/enroll-linked-programs")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<int>>> EnrollLinkedPrograms(
        Guid periodId,
        Guid offeringId,
        [FromBody] EnrollLinkedProgramsRequest request)
    {
        var response = await _offeringService.EnrollLinkedProgramsAsync(periodId, offeringId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("{offeringId:guid}/grade-plan")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<OfferingGradePlanDto>>> GetGradePlan(
        Guid periodId,
        Guid offeringId,
        [FromServices] IOfferingGradePlanService gradePlanService)
    {
        var response = await gradePlanService.GetGradePlanAsync(periodId, offeringId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPut("{offeringId:guid}/grade-plan")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<OfferingGradePlanDto>>> SaveGradePlan(
        Guid periodId,
        Guid offeringId,
        [FromBody] SaveOfferingGradePlanRequest request,
        [FromServices] IOfferingGradePlanService gradePlanService)
    {
        var response = await gradePlanService.SaveGradePlanAsync(periodId, offeringId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{offeringId:guid}/publish-timetable")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<PublishTimetableResultDto>>> PublishTimetable(
        Guid periodId,
        Guid offeringId,
        [FromBody] PublishTimetableRequest request,
        [FromServices] IOfferingTimetableService timetableService)
    {
        var response = await timetableService.PublishTimetableAsync(periodId, offeringId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Conflict)
            return Conflict(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("setup-program")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<SetupProgramTermResultDto>>> SetupProgram(
        Guid periodId,
        [FromBody] SetupProgramTermRequest request)
    {
        var response = await _offeringService.SetupProgramTermAsync(periodId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("rollover")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<int>>> Rollover(
        Guid periodId,
        [FromBody] RolloverOfferingsRequest request)
    {
        var response = await _offeringService.RolloverOfferingsAsync(periodId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
