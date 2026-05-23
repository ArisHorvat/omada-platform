using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

/// <summary>
/// Fetches scraped news articles and merges them into <see cref="Entities.NewsItem"/> for an organization.
/// </summary>
public interface INewsSpiderSyncService
{
    Task<SpiderSyncStatsDto> SyncNewsDatabaseAsync(
        Guid organizationId,
        Guid? authorUserId,
        CancellationToken cancellationToken = default);
}
