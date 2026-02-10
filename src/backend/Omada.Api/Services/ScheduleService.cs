using Omada.Api.Entities;
using Omada.Api.Services.Interfaces;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Services;

public class ScheduleService : IScheduleService
{
    private readonly IScheduleRepository _repo;

    public ScheduleService(IScheduleRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IEnumerable<ScheduleItemDto>>> GetScheduleAsync(Guid orgId, ScheduleRequestDto request)
    {
        try
        {
            // Future logic for Recurring patterns goes here
            
            var events = await _repo.GetEventsAsync(
                orgId, 
                request.FromDate, 
                request.ToDate, 
                request.TargetId.Value, 
                request.TargetType
            );

            return Result<IEnumerable<ScheduleItemDto>>.Success(events);
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<ScheduleItemDto>>.Failure($"Failed to fetch schedule: {ex.Message}");
        }
    }
}