using Omada.Api.Abstractions;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Services.Interfaces;

public interface IOfferingTimetableService
{
    Task<ServiceResponse<PublishTimetableResultDto>> PublishTimetableAsync(
        Guid periodId,
        Guid offeringId,
        PublishTimetableRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Seed Expected attendance for all enrollments × published offering events in the period range.</summary>
    Task<ServiceResponse<int>> SeedExpectedAttendanceAsync(
        Guid offeringId,
        CancellationToken cancellationToken = default);
}
