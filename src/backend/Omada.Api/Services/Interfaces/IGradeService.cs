using Omada.Api.Abstractions;
using Omada.Api.DTOs.Grades;

namespace Omada.Api.Services.Interfaces;

public interface IGradeService
{
    /// <summary>
    /// Current user’s grades in the active organization (from JWT) and weighted GPA.
    /// </summary>
    Task<ServiceResponse<MyGradesResponse>> GetMyGradesAsync(CancellationToken cancellationToken = default);
}
