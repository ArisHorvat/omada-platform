using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

/// <summary>Resolves and persists per-organization web spider entry URLs (database, with appsettings fallback).</summary>
public interface ISpiderUrlResolver
{
    Task<SpiderConfigDto> GetConfigAsync(Guid organizationId, CancellationToken cancellationToken = default);

    Task<ServiceResponse<SpiderConfigDto>> SaveConfigAsync(
        Guid organizationId,
        SaveSpiderConfigRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Request URL wins, then org DB, then appsettings.</summary>
    string? ResolveSchedulePageUrl(Guid organizationId, string? requestUrl = null);

    string? ResolveNewsStartUrl(Guid organizationId, string? requestUrl = null);
}
