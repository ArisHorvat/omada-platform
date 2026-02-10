using Dapper;
using System.Data;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Repositories;

public class ScheduleRepository : IScheduleRepository
{
    private readonly IDbConnection _db;

    public ScheduleRepository(IDbConnection db) => _db = db;

    public async Task<IEnumerable<ScheduleItemDto>> GetEventsAsync(Guid orgId, DateTime from, DateTime to, Guid targetId, int targetType)
    {
        var sql = @"
            SELECT e.Id, e.Title, e.Description as Subtitle, e.StartTime, e.EndTime,
                   e.EventType as Type, e.ColorHex as Color
            FROM Events e
            JOIN EventAssociations ea ON e.Id = ea.EventId
            WHERE e.OrganizationId = @OrgId
              AND e.StartTime < @To 
              AND e.EndTime > @From
              AND ea.EntityId = @TargetId
              AND ea.EntityType = @TargetType
            ORDER BY e.StartTime ASC";

        return await _db.QueryAsync<ScheduleItemDto>(sql, new { OrgId = orgId, From = from, To = to, TargetId = targetId, TargetType = targetType });
    }
}