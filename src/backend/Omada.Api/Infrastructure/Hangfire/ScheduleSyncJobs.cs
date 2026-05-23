using Hangfire;
using Microsoft.Extensions.DependencyInjection;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Infrastructure.Hangfire;

/// <summary>
/// Hangfire job entry points. Uses <see cref="IServiceScopeFactory"/> so scoped services (DbContext, sync) resolve correctly per job.
/// </summary>
public class ScheduleSyncJobs
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ScheduleSyncJobs(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SyncScheduleDatabaseAsync(Guid organizationId, Guid runId)
    {
        using var scope = _scopeFactory.CreateScope();
        var sync = scope.ServiceProvider.GetRequiredService<IScheduleSpiderSyncService>();
        var recorder = scope.ServiceProvider.GetRequiredService<ISpiderSyncRunService>();
        await recorder.MarkRunningAsync(runId);
        try
        {
            var stats = await sync.SyncScheduleDatabaseAsync(organizationId, CancellationToken.None);
            await recorder.CompleteAsync(runId, stats);
        }
        catch (Exception ex)
        {
            await recorder.FailAsync(runId, ex.Message);
            throw;
        }
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SyncNewsDatabaseAsync(Guid organizationId, Guid runId, Guid? authorUserId)
    {
        using var scope = _scopeFactory.CreateScope();
        var sync = scope.ServiceProvider.GetRequiredService<INewsSpiderSyncService>();
        var recorder = scope.ServiceProvider.GetRequiredService<ISpiderSyncRunService>();
        await recorder.MarkRunningAsync(runId);
        try
        {
            var stats = await sync.SyncNewsDatabaseAsync(organizationId, authorUserId, CancellationToken.None);
            await recorder.CompleteAsync(runId, stats);
        }
        catch (Exception ex)
        {
            await recorder.FailAsync(runId, ex.Message);
            throw;
        }
    }
}
