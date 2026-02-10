using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Repositories.Interfaces
{
    public interface IScheduleRepository
    {
        Task<IEnumerable<ScheduleItemDto>> GetEventsAsync(Guid orgId, DateTime from, DateTime to, Guid targetId, int targetType);
    }
}