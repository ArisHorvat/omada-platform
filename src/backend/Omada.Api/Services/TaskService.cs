using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;

    public TaskService(ITaskRepository taskRepository, IUnitOfWork uow, IUserContext userContext)
    {
        _taskRepository = taskRepository;
        _uow = uow;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<PagedResponse<TaskItemDto>>> GetUserTasksAsync(PagedRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var pagedTasks = await _taskRepository.GetPagedForUserAsync(organizationId, userId, request.Page, request.PageSize);

        var dtos = pagedTasks.Items.Select(MapToDto).ToList();
        var pagedDto = new PagedResponse<TaskItemDto>
        {
            Items = dtos,
            TotalCount = pagedTasks.TotalCount,
            Page = pagedTasks.Page,
            PageSize = pagedTasks.PageSize
        };

        return new ServiceResponse<PagedResponse<TaskItemDto>>(true, pagedDto);
    }

    public async Task<ServiceResponse<TaskItemDto>> GetTaskByIdAsync(Guid id)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var task = await _taskRepository.GetByIdForUserReadAsync(id, organizationId, userId);
        if (task == null)
            return new ServiceResponse<TaskItemDto>(false, null, new AppError(ErrorCodes.NotFound, "Task not found"));

        return new ServiceResponse<TaskItemDto>(true, MapToDto(task));
    }

    public async Task<ServiceResponse<TaskItemDto>> CreateTaskAsync(CreateTaskRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var assigneeId = request.AssigneeId ?? userId;

        var task = new TaskItem
        {
            OrganizationId = organizationId,
            CreatedByUserId = userId,
            AssigneeId = assigneeId,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            Priority = request.Priority,
            ProjectId = request.ProjectId,
            SubjectId = request.SubjectId,
            MaxScore = request.MaxScore,
            Weight = request.Weight,
            ReferenceUrl = request.ReferenceUrl,
            SubmissionUrl = request.SubmissionUrl
        };

        await _taskRepository.AddAsync(task);
        await _uow.CompleteAsync();

        return new ServiceResponse<TaskItemDto>(true, MapToDto(task));
    }

    public async Task<ServiceResponse<TaskItemDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var task = await _taskRepository.GetByIdForUserMutationAsync(id, organizationId, userId);
        if (task == null)
            return new ServiceResponse<TaskItemDto>(false, null, new AppError(ErrorCodes.NotFound, "Task not found"));

        task.Title = request.Title;
        task.Description = request.Description;
        task.IsCompleted = request.IsCompleted;
        task.DueDate = request.DueDate;
        task.Priority = request.Priority;
        task.ProjectId = request.ProjectId;
        task.SubjectId = request.SubjectId;
        task.MaxScore = request.MaxScore;
        task.Weight = request.Weight;
        task.ReferenceUrl = request.ReferenceUrl;
        task.SubmissionUrl = request.SubmissionUrl;
        task.TeacherFeedback = request.TeacherFeedback;
        task.Grade = request.Grade;

        if (request.AssigneeId.HasValue)
            task.AssigneeId = request.AssigneeId.Value;

        _taskRepository.Update(task);
        await _uow.CompleteAsync();

        return new ServiceResponse<TaskItemDto>(true, MapToDto(task));
    }

    public async Task<ServiceResponse<bool>> DeleteTaskAsync(Guid id)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var task = await _taskRepository.GetByIdForUserMutationAsync(id, organizationId, userId);
        if (task == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Task not found"));

        _taskRepository.Remove(task);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    private static TaskItemDto MapToDto(TaskItem t)
    {
        return new TaskItemDto
        {
            Id = t.Id,
            OrganizationId = t.OrganizationId,
            AssigneeId = t.AssigneeId,
            CreatedByUserId = t.CreatedByUserId,
            Title = t.Title,
            Description = t.Description,
            IsCompleted = t.IsCompleted,
            DueDate = t.DueDate,
            Priority = t.Priority,
            ProjectId = t.ProjectId,
            SubjectId = t.SubjectId,
            MaxScore = t.MaxScore,
            Weight = t.Weight,
            ReferenceUrl = t.ReferenceUrl,
            SubmissionUrl = t.SubmissionUrl,
            TeacherFeedback = t.TeacherFeedback,
            Grade = t.Grade,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        };
    }
}
