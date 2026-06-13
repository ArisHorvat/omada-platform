using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Services.Interfaces;

public interface IOfferingGradePlanService
{
    Task<ServiceResponse<OfferingGradePlanDto>> GetGradePlanAsync(Guid periodId, Guid offeringId);

    Task<ServiceResponse<OfferingGradePlanDto>> SaveGradePlanAsync(
        Guid periodId,
        Guid offeringId,
        SaveOfferingGradePlanRequest request);
}
