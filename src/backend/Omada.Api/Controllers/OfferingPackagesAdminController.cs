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
[Route("api/Organizations/current/offering-packages")]
[Authorize]
public class OfferingPackagesAdminController : ControllerBase
{
    private readonly ICourseOfferingPackageService _packageService;

    public OfferingPackagesAdminController(ICourseOfferingPackageService packageService)
    {
        _packageService = packageService;
    }

    [HttpGet]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<IEnumerable<CourseOfferingPackageDto>>>> GetPackages()
    {
        var response = await _packageService.GetPackagesAsync();
        return Ok(response);
    }

    [HttpGet("{packageId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<CourseOfferingPackageDto>>> GetPackage(Guid packageId)
    {
        var response = await _packageService.GetPackageByIdAsync(packageId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    [HttpPost]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<CourseOfferingPackageDto>>> Create(
        [FromBody] CreateCourseOfferingPackageRequest request)
    {
        var response = await _packageService.CreatePackageAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{packageId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<CourseOfferingPackageDto>>> Update(
        Guid packageId,
        [FromBody] UpdateCourseOfferingPackageRequest request)
    {
        var response = await _packageService.UpdatePackageAsync(packageId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{packageId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid packageId)
    {
        var response = await _packageService.DeletePackageAsync(packageId);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{packageId:guid}/items")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<CourseOfferingPackageDto>>> SaveItems(
        Guid packageId,
        [FromBody] SaveCourseOfferingPackageItemsRequest request)
    {
        var response = await _packageService.SavePackageItemsAsync(packageId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{packageId:guid}/apply/{periodId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<ApplyOfferingPackageResultDto>>> ApplyToPeriod(
        Guid packageId,
        Guid periodId,
        [FromBody] ApplyOfferingPackageRequest request)
    {
        var response = await _packageService.ApplyPackageToPeriodAsync(periodId, packageId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("{packageId:guid}/revert/{periodId:guid}")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<RevertOfferingPackageResultDto>>> RevertFromPeriod(
        Guid packageId,
        Guid periodId)
    {
        var response = await _packageService.RevertPackageFromPeriodAsync(periodId, packageId);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
