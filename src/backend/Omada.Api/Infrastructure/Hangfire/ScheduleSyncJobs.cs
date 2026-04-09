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
    public async Task SyncScheduleDatabaseAsync(Guid organizationId)
    {
        using var scope = _scopeFactory.CreateScope();
        var sync = scope.ServiceProvider.GetRequiredService<IScheduleSpiderSyncService>();
        await sync.SyncScheduleDatabaseAsync(organizationId, CancellationToken.None);
    }
}
