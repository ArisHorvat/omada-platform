using Hangfire;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Hangfire;
using Omada.Api.Infrastructure.Scraping;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class WebSpiderAdminService : IWebSpiderAdminService
{
    private readonly IWebSpiderService _spider;
    private readonly IUserContext _userContext;
    private readonly ISpiderUrlResolver _urlResolver;
    private readonly ISpiderSyncRunService _syncRuns;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<WebSpiderAdminService> _logger;

    public WebSpiderAdminService(
        IWebSpiderService spider,
        IUserContext userContext,
        ISpiderUrlResolver urlResolver,
        ISpiderSyncRunService syncRuns,
        ApplicationDbContext db,
        ILogger<WebSpiderAdminService> logger)
    {
        _spider = spider;
        _userContext = userContext;
        _urlResolver = urlResolver;
        _syncRuns = syncRuns;
        _db = db;
        _logger = logger;
    }

    public Task<ServiceResponse<SpiderConfigDto>> GetConfigAsync(CancellationToken cancellationToken = default) =>
        GetConfigForOrgAsync(_userContext.OrganizationId, cancellationToken);

    public Task<ServiceResponse<SpiderConfigDto>> SaveConfigAsync(
        SaveSpiderConfigRequest request,
        CancellationToken cancellationToken = default) =>
        _urlResolver.SaveConfigAsync(_userContext.OrganizationId, request, cancellationToken);

    private async Task<ServiceResponse<SpiderConfigDto>> GetConfigForOrgAsync(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var config = await _urlResolver.GetConfigAsync(organizationId, cancellationToken);
        return new ServiceResponse<SpiderConfigDto>(true, config);
    }

    public async Task<ServiceResponse<SpiderPreviewScheduleResultDto>> PreviewScheduleAsync(
        SpiderUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryResolveScheduleUrl(request.Url, out var url, out var urlError))
        {
            return new ServiceResponse<SpiderPreviewScheduleResultDto>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, urlError!));
        }

        SiteScheduleExtractionResult extraction;
        try
        {
            extraction = await _spider.ExtractScheduleFromSiteAsync(url, maxSchedulePages: 80, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return new ServiceResponse<SpiderPreviewScheduleResultDto>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, ex.Message));
        }

        if (extraction.Events.Count == 0)
        {
            return new ServiceResponse<SpiderPreviewScheduleResultDto>(
                false,
                null,
                new AppError(
                    ErrorCodes.OperationFailed,
                    "No timetable rows found. If this is an index page, wait for hub links to be crawled, or open a specific year page (e.g. I1.html for Informatica year 1)."));
        }

        var enriched = ScrapedScheduleNormalizer.EnrichAll(extraction.Events);
        enriched = ScrapedScheduleDedup.CleanForPreview(enriched);
        var (parsedCount, unparsedCount) = ScrapedScheduleNormalizer.CountParseResults(enriched);

        return new ServiceResponse<SpiderPreviewScheduleResultDto>(true, new SpiderPreviewScheduleResultDto
        {
            SourceUrl = url,
            Events = enriched,
            EventCount = enriched.Count,
            CrawledMultiplePages = extraction.CrawledMultiplePages,
            Pages = extraction.Pages,
            HubLinksDiscovered = extraction.HubLinksDiscovered,
            SchedulePagesScraped = extraction.SchedulePagesScraped,
            WasTruncated = extraction.WasTruncated,
            ParsedTimeCount = parsedCount,
            UnparsedTimeCount = unparsedCount,
        });
    }

    public async Task<ServiceResponse<SpiderDiscoveryResult>> DiscoverScheduleAsync(
        SpiderUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryResolveScheduleUrl(request.Url, out var url, out var urlError))
        {
            return new ServiceResponse<SpiderDiscoveryResult>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, urlError!));
        }

        try
        {
            var result = await _spider.DiscoverLinksAsync(url, cancellationToken);
            return new ServiceResponse<SpiderDiscoveryResult>(true, result);
        }
        catch (ArgumentException ex)
        {
            return new ServiceResponse<SpiderDiscoveryResult>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, ex.Message));
        }
    }

    public async Task<ServiceResponse<SpiderSyncEnqueueResultDto>> EnqueueScheduleSyncAsync(
        SpiderUrlRequest? request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var orgId = _userContext.OrganizationId;

        if (!string.IsNullOrWhiteSpace(request?.Url))
        {
            await _urlResolver.SaveConfigAsync(
                orgId,
                new SaveSpiderConfigRequest { SchedulePageUrl = request.Url.Trim() },
                cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(_urlResolver.ResolveSchedulePageUrl(orgId)))
        {
            return new ServiceResponse<SpiderSyncEnqueueResultDto>(
                false,
                null,
                new AppError(
                    ErrorCodes.InvalidInput,
                    "Enter a timetable URL and tap Save URL, or use Sync to DB with a URL in the field."));
        }

        var runId = await _syncRuns.CreateQueuedRunAsync(orgId, SpiderSyncKind.Schedule, _userContext.UserId, cancellationToken);
        var jobId = BackgroundJob.Enqueue<ScheduleSyncJobs>(j => j.SyncScheduleDatabaseAsync(orgId, runId));
        await _syncRuns.SetHangfireJobIdAsync(runId, jobId, cancellationToken);
        _logger.LogInformation("Enqueued schedule spider sync job {JobId} for organization {OrganizationId}", jobId, orgId);

        return new ServiceResponse<SpiderSyncEnqueueResultDto>(true, new SpiderSyncEnqueueResultDto
        {
            JobId = jobId,
            Message = "Schedule import sync queued. Check sync history for progress.",
        });
    }

    public Task<ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>> GetSyncHistoryAsync(
        int limit = 20,
        CancellationToken cancellationToken = default) =>
        _syncRuns.GetRecentRunsAsync(_userContext.OrganizationId, limit, cancellationToken);

    public async Task<ServiceResponse<IReadOnlyList<UnresolvedScrapedEventDto>>> GetUnresolvedScheduleEventsAsync(
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var rows = await _db.ScrapedClassEvents
            .AsNoTracking()
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted)
            .Where(e =>
                (!string.IsNullOrWhiteSpace(e.Professor) && e.HostId == null) ||
                (!string.IsNullOrWhiteSpace(e.RoomText) && e.RoomId == null))
            .OrderBy(e => e.ClassName)
            .Take(100)
            .Select(e => new UnresolvedScrapedEventDto
            {
                Id = e.Id,
                ClassName = e.ClassName,
                Professor = e.Professor,
                RoomText = e.RoomText,
                Time = e.Time,
                GroupNumber = e.GroupNumber,
                MissingHost = !string.IsNullOrWhiteSpace(e.Professor) && e.HostId == null,
                MissingRoom = !string.IsNullOrWhiteSpace(e.RoomText) && e.RoomId == null
            })
            .ToListAsync(cancellationToken);

        return new ServiceResponse<IReadOnlyList<UnresolvedScrapedEventDto>>(true, rows);
    }

    private bool TryResolveScheduleUrl(string? requestUrl, out string url, out string? error)
    {
        var resolved = _urlResolver.ResolveSchedulePageUrl(_userContext.OrganizationId, requestUrl);
        if (!string.IsNullOrWhiteSpace(resolved))
        {
            url = resolved;
            error = null;
            return true;
        }

        url = string.Empty;
        error = "Enter a timetable URL in the field above (optionally tap Save URL for background sync).";
        return false;
    }
}
