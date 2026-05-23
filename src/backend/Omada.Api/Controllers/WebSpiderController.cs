using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
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

    [HttpPost("news/preview")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderPreviewNewsResultDto>>> PreviewNews(
        [FromBody] SpiderUrlRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.PreviewNewsAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("news/discover")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<NewsDiscoveryResult>>> DiscoverNews(
        [FromBody] SpiderUrlRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.DiscoverNewsAsync(request, cancellationToken);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("news/sync")]
    [HasPermission(WidgetKeys.Admin, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<SpiderSyncEnqueueResultDto>>> EnqueueNewsSync(
        [FromBody] SpiderUrlRequest? request,
        CancellationToken cancellationToken)
    {
        var response = await _webSpiderAdminService.EnqueueNewsSyncAsync(request, cancellationToken);
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
}
