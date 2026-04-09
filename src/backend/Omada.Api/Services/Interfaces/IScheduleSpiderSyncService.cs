namespace Omada.Api.Services.Interfaces;

/// <summary>
/// Fetches scraped timetable rows and merges them into <see cref="Entities.ScrapedClassEvent"/> for an organization (hash-based upsert).
/// </summary>
public interface IScheduleSpiderSyncService
{
    /// <summary>
    /// Downloads the configured schedule HTML, extracts rows, upserts by natural key, sets <c>IsChanged</c> when hash differs, removes rows no longer present in the scrape.
    /// </summary>
    Task SyncScheduleDatabaseAsync(Guid organizationId, CancellationToken cancellationToken = default);
}
