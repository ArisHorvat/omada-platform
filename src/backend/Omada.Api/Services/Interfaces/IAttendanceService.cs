using Omada.Api.Abstractions;
using Omada.Api.DTOs.Attendance;
using Omada.Api.DTOs.Common;

namespace Omada.Api.Services.Interfaces;

public interface IAttendanceService
{
    Task<ServiceResponse<MyAttendanceResponse>> GetMyAttendanceAsync(
        Guid? groupId = null,
        int? days = null,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<PagedResponse<AttendanceAdminRecordDto>>> GetAdminRecordsAsync(
        PagedRequest request,
        Guid? userId,
        Guid? groupId,
        int? days,
        CancellationToken cancellationToken = default);
}
