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

    Task<ServiceResponse<bool>> RecordMemberAttendanceAsync(
        RecordMemberAttendanceRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<AttendanceSessionRosterDto>> GetSessionRosterAsync(
        Guid eventId,
        DateTime instanceDate,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<bool>> BulkMarkSessionRosterAsync(
        Guid eventId,
        BulkMarkAttendanceRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<MyOfferingAttendanceResponse>> GetMyOfferingAttendanceAsync(
        Guid? periodId,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<WorkTimeTodayResponse>> GetWorkTimeAsync(
        int recentDays = 14,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse<WorkTimeEntryDto>> ClockInAsync(CancellationToken cancellationToken = default);

    Task<ServiceResponse<WorkTimeEntryDto>> ClockOutAsync(CancellationToken cancellationToken = default);

    Task<ServiceResponse<WorkTimeEntryDto>> SetTodayBreakAsync(
        SetWorkBreakRequest request,
        CancellationToken cancellationToken = default);
}
