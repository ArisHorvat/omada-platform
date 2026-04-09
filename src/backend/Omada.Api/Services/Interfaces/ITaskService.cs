using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Tasks;

namespace Omada.Api.Services.Interfaces;

public interface ITaskService
{
    Task<ServiceResponse<PagedResponse<TaskItemDto>>> GetUserTasksAsync(PagedRequest request);

    Task<ServiceResponse<TaskItemDto>> GetTaskByIdAsync(Guid id);

    Task<ServiceResponse<TaskItemDto>> CreateTaskAsync(CreateTaskRequest request);

    Task<ServiceResponse<TaskItemDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request);

    Task<ServiceResponse<bool>> DeleteTaskAsync(Guid id);
}
