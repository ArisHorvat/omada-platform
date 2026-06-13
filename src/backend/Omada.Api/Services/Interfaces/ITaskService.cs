using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Tasks;

namespace Omada.Api.Services.Interfaces;

public interface ITaskService
{
    Task<ServiceResponse<PagedResponse<TaskItemDto>>> GetUserTasksAsync(
        PagedRequest request,
        Guid? groupId = null,
        Guid? offeringId = null);

    Task<ServiceResponse<TaskItemDto>> GetTaskByIdAsync(Guid id);

    Task<ServiceResponse<TaskItemDto>> CreateTaskAsync(CreateTaskRequest request);

    Task<ServiceResponse<CreateAssignmentBatchResultDto>> CreateAssignmentBatchAsync(CreateAssignmentBatchRequest request);

    Task<ServiceResponse<PagedResponse<AssignmentBatchSummaryDto>>> GetAssignmentBatchesAsync(PagedRequest request);

    Task<ServiceResponse<IEnumerable<AssignmentBatchSubmissionDto>>> GetAssignmentBatchSubmissionsAsync(Guid batchId);

    Task<ServiceResponse<bool>> DeleteAssignmentBatchAsync(Guid batchId);

    Task<ServiceResponse<TaskItemDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request);

    Task<ServiceResponse<TaskItemDto>> SubmitTaskSubmissionAsync(Guid id, SubmitTaskSubmissionRequest request);

    Task<ServiceResponse<bool>> DeleteTaskAsync(Guid id);
}
