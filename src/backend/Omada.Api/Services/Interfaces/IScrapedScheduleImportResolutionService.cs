using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

public interface IScrapedScheduleImportResolutionService
{
    Task<ServiceResponse<ScrapedImportResolutionResultDto>> ResolveAsync(
        ScrapedImportResolutionRequest request,
        CancellationToken cancellationToken = default);
}
