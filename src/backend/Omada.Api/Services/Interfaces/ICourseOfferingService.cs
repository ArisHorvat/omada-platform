using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services.Interfaces;

public interface ICourseOfferingService
{
    Task<ServiceResponse<CurrentOrganizationPeriodDto>> GetCurrentPeriodAsync();

    Task<ServiceResponse<IEnumerable<OrganizationPeriodDto>>> GetOrganizationPeriodsAsync();

    Task<ServiceResponse<IEnumerable<CourseOfferingDto>>> GetOfferingsForPeriodAsync(Guid periodId);

    Task<ServiceResponse<CourseOfferingDto>> CreateOfferingAsync(Guid periodId, CreateCourseOfferingRequest request);

    Task<ServiceResponse<CourseOfferingDto>> UpdateOfferingAsync(Guid periodId, Guid offeringId, UpdateCourseOfferingRequest request);

    Task<ServiceResponse<bool>> DeleteOfferingAsync(Guid periodId, Guid offeringId);

    Task<ServiceResponse<IEnumerable<OfferingEnrollmentDto>>> GetEnrollmentsAsync(Guid periodId, Guid offeringId);

    Task<ServiceResponse<int>> EnrollCohortAsync(Guid periodId, Guid offeringId, EnrollCohortRequest request);

    Task<ServiceResponse<int>> EnrollProgramCohortsAsync(Guid periodId, Guid offeringId, EnrollProgramCohortsRequest request);

    Task<ServiceResponse<int>> EnrollLinkedProgramsAsync(Guid periodId, Guid offeringId, EnrollLinkedProgramsRequest request);

    Task<ServiceResponse<int>> UnenrollUserAsync(Guid periodId, Guid offeringId, UnenrollUserRequest request);

    Task<ServiceResponse<int>> UnenrollCohortAsync(Guid periodId, Guid offeringId, UnenrollCohortRequest request);

    Task<ServiceResponse<SetupProgramTermResultDto>> SetupProgramTermAsync(Guid periodId, SetupProgramTermRequest request);

    Task<ServiceResponse<int>> RolloverOfferingsAsync(Guid targetPeriodId, RolloverOfferingsRequest request);

    Task<ServiceResponse<IEnumerable<OfferingPickerItemDto>>> GetAssignableOfferingsAsync(Guid? periodId);

    Task<ServiceResponse<IEnumerable<OfferingPickerItemDto>>> GetMyEnrollmentsAsync(Guid? periodId);
}
