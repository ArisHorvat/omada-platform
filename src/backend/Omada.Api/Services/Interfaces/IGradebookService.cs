using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Services.Interfaces;

public interface IGradebookService
{
    Task<ServiceResponse<OfferingGradebookDto>> GetOfferingGradebookAsync(
        Guid periodId,
        Guid offeringId,
        Guid? cohortGroupId = null);

    Task<ServiceResponse<StudentOfferingGradeBreakdownDto>> GetStudentBreakdownAsync(
        Guid periodId,
        Guid offeringId,
        Guid userId);
}
