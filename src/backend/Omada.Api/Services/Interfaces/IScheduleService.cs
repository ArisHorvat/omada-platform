using Omada.Api.Entities;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Abstractions;

namespace Omada.Api.Services.Interfaces;

public interface IScheduleService
{
    Task<ServiceResponse<IEnumerable<ScheduleItemDto>>> GetScheduleAsync(GetScheduleRequest request);
    Task<ServiceResponse<ScheduleItemDto>> CreateEventAsync(CreateEventRequest request);
    Task<ServiceResponse<ScheduleItemDto>> UpdateEventAsync(Guid id, CreateEventRequest request);
    Task<ServiceResponse<bool>> UpdateAttendanceAsync(Guid eventId, UpdateAttendanceRequest request);
    Task<ServiceResponse<bool>> DeleteEventAsync(Guid id);
    Task<ServiceResponse<bool>> CancelEventInstanceAsync(Guid eventId, DateTime originalDate);
    Task<ServiceResponse<IEnumerable<HostDto>>> SearchHostsAsync(string query);
    Task<ServiceResponse<IEnumerable<EventTypeDto>>> GetEventTypesAsync();
    Task<ServiceResponse<ScheduleUserStatusDto>> GetUserScheduleStatusAsync(Guid userId);

    /// <summary>
    /// Other sections / times with the same subject (<see cref="ScheduleItemDto.Title"/>) and event type in the same calendar week as <paramref name="instanceDate"/>.
    /// </summary>
    Task<ServiceResponse<IEnumerable<ScheduleItemDto>>> GetAlternativeClassTimesAsync(Guid eventId, DateTime instanceDate);

    Task<ServiceResponse<IEnumerable<BusyIntervalDto>>> GetBusyIntervalsAsync(Guid userId, DateTime from, DateTime to);

    Task<ServiceResponse<bool>> ProposeMeetingTimeAsync(Guid eventId, ProposeMeetingTimeRequest request);
}