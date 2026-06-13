using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Services.Interfaces;

public interface ICourseOfferingPackageService
{
    Task<ServiceResponse<IEnumerable<CourseOfferingPackageDto>>> GetPackagesAsync();

    Task<ServiceResponse<CourseOfferingPackageDto>> GetPackageByIdAsync(Guid packageId);

    Task<ServiceResponse<CourseOfferingPackageDto>> CreatePackageAsync(CreateCourseOfferingPackageRequest request);

    Task<ServiceResponse<CourseOfferingPackageDto>> UpdatePackageAsync(Guid packageId, UpdateCourseOfferingPackageRequest request);

    Task<ServiceResponse<bool>> DeletePackageAsync(Guid packageId);

    Task<ServiceResponse<CourseOfferingPackageDto>> SavePackageItemsAsync(
        Guid packageId,
        SaveCourseOfferingPackageItemsRequest request);

    Task<ServiceResponse<ApplyOfferingPackageResultDto>> ApplyPackageToPeriodAsync(
        Guid periodId,
        Guid packageId,
        ApplyOfferingPackageRequest request);

    Task<ServiceResponse<RevertOfferingPackageResultDto>> RevertPackageFromPeriodAsync(
        Guid periodId,
        Guid packageId);
}
