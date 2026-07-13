using Omada.Api.Abstractions;
using Omada.Api.DTOs.Organizations;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

public interface IScrapedHostAliasService
{
    Task<ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>> GetAliasesAsync(CancellationToken cancellationToken = default);

    Task<ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>> SaveAliasesAsync(
        SaveScrapedHostAliasesRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ScrapedHostAliasDto>> GetAliasesForOrgAsync(Guid organizationId, CancellationToken cancellationToken = default);

    Task TryLinkAliasesToUserAsync(Guid organizationId, Guid userId, string firstName, string lastName, CancellationToken cancellationToken = default);

    Task PersistProfessorMappingsAsync(
        Guid organizationId,
        ScrapedImportMappingsDto? mappings,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>> LinkHostAliasAsync(
        LinkScrapedHostAliasRequest request,
        CancellationToken cancellationToken = default);
}
