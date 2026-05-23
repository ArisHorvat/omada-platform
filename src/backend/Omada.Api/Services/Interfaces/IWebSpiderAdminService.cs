using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

/// <summary>Organization-admin operations for previewing and triggering web spider jobs.</summary>
public interface IWebSpiderAdminService
{
    Task<ServiceResponse<SpiderConfigDto>> GetConfigAsync(CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderConfigDto>> SaveConfigAsync(
        SaveSpiderConfigRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderPreviewScheduleResultDto>> PreviewScheduleAsync(
        SpiderUrlRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderDiscoveryResult>> DiscoverScheduleAsync(
        SpiderUrlRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderSyncEnqueueResultDto>> EnqueueScheduleSyncAsync(
        SpiderUrlRequest? request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderPreviewNewsResultDto>> PreviewNewsAsync(
        SpiderUrlRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<NewsDiscoveryResult>> DiscoverNewsAsync(
        SpiderUrlRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderSyncEnqueueResultDto>> EnqueueNewsSyncAsync(
        SpiderUrlRequest? request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>> GetSyncHistoryAsync(
        int limit = 20,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<IReadOnlyList<UnresolvedScrapedEventDto>>> GetUnresolvedScheduleEventsAsync(
        CancellationToken cancellationToken = default);
}
