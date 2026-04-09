using Omada.Api.Abstractions;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Services.Interfaces;

public interface IEventTypeService
{
    Task<ServiceResponse<IEnumerable<EventTypeDto>>> GetAllAsync();
    Task<ServiceResponse<EventTypeDto>> CreateAsync(CreateEventTypeRequest request);
    Task<ServiceResponse<EventTypeDto>> UpdateAsync(Guid id, CreateEventTypeRequest request);
    Task<ServiceResponse<bool>> DeleteAsync(Guid id);
}