using Omada.Api.Entities;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Services.Interfaces;

public interface IScheduleService
{
    Task<Result<IEnumerable<ScheduleItemDto>>> GetScheduleAsync(Guid orgId, ScheduleRequestDto request);
}