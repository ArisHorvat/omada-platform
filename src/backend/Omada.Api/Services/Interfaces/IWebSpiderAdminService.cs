using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

/// <summary>Organization-admin operations for schedule import preview and sync.</summary>
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

    Task<ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>> GetSyncHistoryAsync(
        int limit = 20,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<IReadOnlyList<UnresolvedScrapedEventDto>>> GetUnresolvedScheduleEventsAsync(
        CancellationToken cancellationToken = default);
}
