using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class SpiderSyncRunService : ISpiderSyncRunService
{
    private readonly ApplicationDbContext _db;
    private readonly IUserContext _userContext;

    public SpiderSyncRunService(ApplicationDbContext db, IUserContext userContext)
    {
        _db = db;
        _userContext = userContext;
    }

    public async Task<Guid> CreateQueuedRunAsync(
        Guid organizationId,
        SpiderSyncKind kind,
        Guid? initiatedByUserId,
        CancellationToken cancellationToken = default)
    {
        var run = new SpiderSyncRun
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Kind = kind,
            Status = SpiderSyncStatus.Queued,
            StartedAt = DateTime.UtcNow,
            InitiatedByUserId = initiatedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.SpiderSyncRuns.Add(run);
        await _db.SaveChangesAsync(cancellationToken);
        return run.Id;
    }

    public async Task SetHangfireJobIdAsync(Guid runId, string jobId, CancellationToken cancellationToken = default)
    {
        var run = await _db.SpiderSyncRuns.FirstOrDefaultAsync(r => r.Id == runId, cancellationToken);
        if (run == null) return;

        run.HangfireJobId = jobId;
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkRunningAsync(Guid runId, CancellationToken cancellationToken = default)
    {
        var run = await _db.SpiderSyncRuns.FirstOrDefaultAsync(r => r.Id == runId, cancellationToken);
        if (run == null) return;

        run.Status = SpiderSyncStatus.Running;
        run.StartedAt = DateTime.UtcNow;
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task CompleteAsync(Guid runId, SpiderSyncStatsDto stats, CancellationToken cancellationToken = default)
    {
        var run = await _db.SpiderSyncRuns.FirstOrDefaultAsync(r => r.Id == runId, cancellationToken);
        if (run == null) return;

        run.Status = SpiderSyncStatus.Completed;
        run.CompletedAt = DateTime.UtcNow;
        run.ItemsProcessed = stats.Processed;
        run.ItemsCreated = stats.Created;
        run.ItemsUpdated = stats.Updated;
        run.ItemsRemoved = stats.Removed;
        run.ItemsSkipped = stats.Skipped;
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task FailAsync(Guid runId, string errorMessage, CancellationToken cancellationToken = default)
    {
        var run = await _db.SpiderSyncRuns.FirstOrDefaultAsync(r => r.Id == runId, cancellationToken);
        if (run == null) return;

        run.Status = SpiderSyncStatus.Failed;
        run.CompletedAt = DateTime.UtcNow;
        run.ErrorMessage = errorMessage.Length > 2000 ? errorMessage[..2000] : errorMessage;
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>> GetRecentRunsAsync(
        Guid organizationId,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        if (organizationId != _userContext.OrganizationId)
        {
            return new ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>(
                false,
                null,
                new AppError("FORBIDDEN", "You can only view sync history for your active organization."));
        }

        var take = Math.Clamp(limit, 1, 50);
        var runs = await _db.SpiderSyncRuns
            .AsNoTracking()
            .Where(r => r.OrganizationId == organizationId && !r.IsDeleted)
            .OrderByDescending(r => r.StartedAt)
            .Take(take)
            .Select(r => new SpiderSyncRunDto
            {
                Id = r.Id,
                Kind = r.Kind,
                Status = r.Status,
                StartedAt = r.StartedAt,
                CompletedAt = r.CompletedAt,
                ErrorMessage = r.ErrorMessage,
                ItemsProcessed = r.ItemsProcessed,
                ItemsCreated = r.ItemsCreated,
                ItemsUpdated = r.ItemsUpdated,
                ItemsRemoved = r.ItemsRemoved,
                ItemsSkipped = r.ItemsSkipped,
                HangfireJobId = r.HangfireJobId
            })
            .ToListAsync(cancellationToken);

        return new ServiceResponse<IReadOnlyList<SpiderSyncRunDto>>(true, runs);
    }
}
