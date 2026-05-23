using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Grades;

namespace Omada.Api.Services.Interfaces;

public interface IGradeService
{
    /// <summary>
    /// Current user’s grades in the active organization (from JWT) and weighted GPA.
    /// </summary>
    Task<ServiceResponse<MyGradesResponse>> GetMyGradesAsync(
        Guid? groupId = null,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<PagedResponse<GradeAdminDto>>> GetAdminGradesAsync(
        PagedRequest request,
        Guid? userId,
        string? semester,
        Guid? groupId,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<GradeAdminDto>> CreateGradeAsync(
        CreateGradeRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<GradeAdminDto>> UpdateGradeAsync(
        Guid id,
        UpdateGradeRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<bool>> DeleteGradeAsync(Guid id, CancellationToken cancellationToken = default);
}
