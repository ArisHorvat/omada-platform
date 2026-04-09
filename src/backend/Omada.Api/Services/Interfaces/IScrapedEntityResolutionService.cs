using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

/// <summary>
/// Maps raw scraped professor/room strings to org-scoped <see cref="Entities.User"/> and <see cref="Entities.Room"/> ids (batched + cached).
/// </summary>
public interface IScrapedEntityResolutionService
{
    Task<ScrapedEventResolutionMaps> BuildMapsAsync(Guid organizationId, IReadOnlyList<ScrapedEventDto> dtos, CancellationToken cancellationToken = default);
}
