using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/web-spider")]
[Authorize]
public class WebSpiderController : ControllerBase
{
    private readonly IWebSpiderAdminService _webSpiderAdminService;

    public WebSpiderController(IWebSpiderAdminService webSpiderAdminService)
    {
        _webSpiderAdminService = webSpiderAdminService;
    }

    [HttpGet("config")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderConfigDto>>> GetConfig(CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.GetConfigAsync(cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("config")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderConfigDto>>> SaveConfig(
        [FromBody] SaveSpiderConfigRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.SaveConfigAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("schedule/preview")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderPreviewScheduleResultDto>>> PreviewSchedule(
        [FromBody] SpiderUrlRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.PreviewScheduleAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("schedule/discover")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderDiscoveryResult>>> DiscoverSchedule(
        [FromBody] SpiderUrlRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.DiscoverScheduleAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("schedule/sync")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderSyncEnqueueResultDto>>> EnqueueScheduleSync(
        [FromBody] SpiderUrlRequest? request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.EnqueueScheduleSyncAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("sync/history")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>>> GetSyncHistory(
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _webSpiderAdminService.GetSyncHistoryAsync(limit, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("schedule/unresolved")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<IReadOnlyList<UnresolvedScrapedEventDto>>>> GetUnresolvedScheduleEvents(
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.GetUnresolvedScheduleEventsAsync(cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>Preview weekly session pattern from scoped scraped rows for one offering.</summary>
    [HttpPost("schedule/apply-to-offering/preview")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<ApplyScrapedSchedulePreviewResultDto>>> PreviewApplyScrapedToOffering(
        [FromBody] ApplyScrapedScheduleRequest request,
        [FromServices] IScrapedScheduleApplyService applyService,
        CancellationToken cancellationToken)
    {
        var response = await applyService.PreviewApplyAsync(request, cancellationToken);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>Write proposed weekly sessions onto the offering pattern (Build tab).</summary>
    [HttpPost("schedule/apply-to-offering")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<ApplyScrapedScheduleResultDto>>> ApplyScrapedToOffering(
        [FromBody] ApplyScrapedScheduleRequest request,
        [FromServices] IScrapedScheduleApplyService applyService,
        CancellationToken cancellationToken)
    {
        var response = await applyService.ApplyAsync(request, cancellationToken);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>Suggest mappings for scraped labels → offerings, event types, hosts, rooms, groups.</summary>
    [HttpPost("schedule/import-resolution")]
    [RequiresOrgAdmin]
    public async Task<ActionResult<ServiceResponse<ScrapedImportResolutionResultDto>>> ResolveImportMappings(
        [FromBody] ScrapedImportResolutionRequest request,
        [FromServices] IScrapedScheduleImportResolutionService resolutionService,
        CancellationToken cancellationToken)
    {
        var response = await resolutionService.ResolveAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
