using Omada.Api.Abstractions;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

public interface IScrapedScheduleApplyService
{
    Task<ServiceResponse<ApplyScrapedSchedulePreviewResultDto>> PreviewApplyAsync(
        ApplyScrapedScheduleRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<ApplyScrapedScheduleResultDto>> ApplyAsync(
        ApplyScrapedScheduleRequest request,
        CancellationToken cancellationToken = default);
}
