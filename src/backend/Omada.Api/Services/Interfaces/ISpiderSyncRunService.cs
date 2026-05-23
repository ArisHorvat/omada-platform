using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface ISpiderSyncRunService
{
    Task<Guid> CreateQueuedRunAsync(
        Guid organizationId,
        SpiderSyncKind kind,
        Guid? initiatedByUserId,
        CancellationToken cancellationToken = default);

    Task SetHangfireJobIdAsync(Guid runId, string jobId, CancellationToken cancellationToken = default);

    Task MarkRunningAsync(Guid runId, CancellationToken cancellationToken = default);

    Task CompleteAsync(Guid runId, SpiderSyncStatsDto stats, CancellationToken cancellationToken = default);

    Task FailAsync(Guid runId, string errorMessage, CancellationToken cancellationToken = default);

    Task<ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>> GetRecentRunsAsync(
        Guid organizationId,
        int limit = 20,
        CancellationToken cancellationToken = default);
}
