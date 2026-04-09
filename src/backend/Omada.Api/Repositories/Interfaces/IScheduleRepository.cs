using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IScheduleRepository : IGenericRepository<Event>
{
    Task<IEnumerable<Event>> GetEventsForScheduleAsync(
        Guid orgId,
        DateTime from,
        DateTime to,
        Guid? hostId = null,
        Guid? groupId = null,
        Guid? roomId = null,
        Guid? userId = null,
        bool myScheduleOnly = false,
        bool publicOnly = false);
    Task<Event?> GetConflictAsync(Guid orgId, DateTime startTime, DateTime endTime, Guid? roomId, Guid? hostId);
    Task<IEnumerable<User>> SearchHostsAsync(Guid orgId, string query);
}