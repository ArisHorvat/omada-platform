using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly ApplicationDbContext _context;

    public TaskService(
        ITaskRepository taskRepository,
        IUnitOfWork uow,
        IUserContext userContext,
        ApplicationDbContext context)
    {
        _taskRepository = taskRepository;
        _uow = uow;
        _userContext = userContext;
        _context = context;
    }

    public async Task<ServiceResponse<PagedResponse<TaskItemDto>>> GetUserTasksAsync(
        PagedRequest request,
        Guid? groupId = null)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var pagedTasks = await _taskRepository.GetPagedForUserAsync(
            organizationId,
            userId,
            request.Page,
            request.PageSize,
            groupId);

        var groupNames = await LoadGroupNamesAsync(
            organizationId,
            pagedTasks.Items.Where(t => t.SubjectId.HasValue).Select(t => t.SubjectId!.Value));

        var dtos = pagedTasks.Items.Select(t => MapToDto(t, groupNames)).ToList();
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

        var groupNames = await LoadGroupNamesAsync(
            organizationId,
            task.SubjectId.HasValue ? new[] { task.SubjectId.Value } : Array.Empty<Guid>());

        return new ServiceResponse<TaskItemDto>(true, MapToDto(task, groupNames));
    }

    public async Task<ServiceResponse<TaskItemDto>> CreateTaskAsync(CreateTaskRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var groupError = await ValidateAssignmentGroupAsync(organizationId, request.SubjectId);
        if (groupError != null)
            return new ServiceResponse<TaskItemDto>(false, null, groupError);

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

        var groupNames = await LoadGroupNamesAsync(
            organizationId,
            task.SubjectId.HasValue ? new[] { task.SubjectId.Value } : Array.Empty<Guid>());

        return new ServiceResponse<TaskItemDto>(true, MapToDto(task, groupNames));
    }

    public async Task<ServiceResponse<TaskItemDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var groupError = await ValidateAssignmentGroupAsync(organizationId, request.SubjectId);
        if (groupError != null)
            return new ServiceResponse<TaskItemDto>(false, null, groupError);

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

        var groupNames = await LoadGroupNamesAsync(
            organizationId,
            task.SubjectId.HasValue ? new[] { task.SubjectId.Value } : Array.Empty<Guid>());

        return new ServiceResponse<TaskItemDto>(true, MapToDto(task, groupNames));
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

    private async Task<AppError?> ValidateAssignmentGroupAsync(Guid organizationId, Guid? groupId)
    {
        if (!groupId.HasValue)
            return null;

        var group = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == groupId.Value && g.OrganizationId == organizationId && !g.IsDeleted);

        if (group == null)
            return new AppError(ErrorCodes.NotFound, "Selected group was not found.");

        var allowed = GetAssignableTypesForContext("assignment");
        if (!allowed.Contains(GroupTypes.Normalize(group.Type)))
            return new AppError(ErrorCodes.InvalidInput, "That group type cannot be linked to an assignment.");

        return null;
    }

    private static HashSet<string> GetAssignableTypesForContext(string context)
    {
        var key = context.Trim().ToLowerInvariant();
        return key switch
        {
            "assignment" or "assignments" or "tasks" => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Subject, GroupTypes.Class, GroupTypes.Series, GroupTypes.Program,
                GroupTypes.Team, GroupTypes.Project
            },
            _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Subject, GroupTypes.Class, GroupTypes.Series, GroupTypes.Program,
                GroupTypes.Team, GroupTypes.Project
            }
        };
    }

    private async Task<Dictionary<Guid, string>> LoadGroupNamesAsync(Guid organizationId, IEnumerable<Guid> groupIds)
    {
        var ids = groupIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, string>();

        return await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && ids.Contains(g.Id))
            .ToDictionaryAsync(g => g.Id, g => g.Name);
    }

    private static TaskItemDto MapToDto(TaskItem t, IReadOnlyDictionary<Guid, string> groupNames)
    {
        string? groupName = null;
        if (t.SubjectId.HasValue && groupNames.TryGetValue(t.SubjectId.Value, out var name))
            groupName = name;

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
            GroupName = groupName,
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
