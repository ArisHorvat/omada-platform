using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Infrastructure.Security;
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
        Guid? groupId = null,
        Guid? offeringId = null)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var pagedTasks = await _taskRepository.GetPagedForUserAsync(
            organizationId,
            userId,
            request.Page,
            request.PageSize,
            groupId,
            offeringId);

        var dtos = await MapTasksAsync(organizationId, pagedTasks.Items);
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

        var dto = (await MapTasksAsync(organizationId, new[] { task })).First();
        return new ServiceResponse<TaskItemDto>(true, dto);
    }

    public async Task<ServiceResponse<TaskItemDto>> CreateTaskAsync(CreateTaskRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var groupError = await ValidateAssignmentGroupAsync(organizationId, request.SubjectId);
        if (groupError != null)
            return new ServiceResponse<TaskItemDto>(false, null, groupError);

        var offeringError = await ValidateOfferingAsync(organizationId, request.OfferingId);
        if (offeringError != null)
            return new ServiceResponse<TaskItemDto>(false, null, offeringError);

        var categoryError = await ValidateGradeCategoryAsync(organizationId, request.OfferingId, request.GradeCategoryId);
        if (categoryError != null)
            return new ServiceResponse<TaskItemDto>(false, null, categoryError);

        var offering = request.OfferingId.HasValue
            ? await _context.CourseOfferings.AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == request.OfferingId.Value && o.OrganizationId == organizationId)
            : null;

        var assigneeId = request.OfferingId.HasValue ? userId : (request.AssigneeId ?? userId);

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
            SubjectId = request.SubjectId ?? offering?.SubjectCatalogGroupId,
            PeriodId = offering?.PeriodId,
            OfferingId = request.OfferingId,
            GradeCategoryId = request.GradeCategoryId,
            MaxScore = request.MaxScore,
            Weight = request.Weight,
            ReferenceUrl = request.ReferenceUrl,
            MaterialsJson = TaskAttachmentJson.Serialize(StampAttachments(request.Materials, userId, "material")),
            SubmissionUrl = request.SubmissionUrl,
            SubmissionAttachmentsJson = TaskAttachmentJson.Serialize(
                StampAttachments(request.SubmissionAttachments, userId, "submission"))
        };

        await _taskRepository.AddAsync(task);
        await _uow.CompleteAsync();

        var dto = (await MapTasksAsync(organizationId, new[] { task })).First();
        return new ServiceResponse<TaskItemDto>(true, dto);
    }

    public async Task<ServiceResponse<TaskItemDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var groupError = await ValidateAssignmentGroupAsync(organizationId, request.SubjectId);
        if (groupError != null)
            return new ServiceResponse<TaskItemDto>(false, null, groupError);

        var offeringError = await ValidateOfferingAsync(organizationId, request.OfferingId);
        if (offeringError != null)
            return new ServiceResponse<TaskItemDto>(false, null, offeringError);

        var task = await _taskRepository.GetByIdForUserMutationAsync(id, organizationId, userId);
        if (task == null)
            return new ServiceResponse<TaskItemDto>(false, null, new AppError(ErrorCodes.NotFound, "Task not found"));

        var categoryError = await ValidateGradeCategoryAsync(
            organizationId,
            request.OfferingId ?? task.OfferingId,
            request.GradeCategoryId ?? task.GradeCategoryId);
        if (categoryError != null)
            return new ServiceResponse<TaskItemDto>(false, null, categoryError);

        var offering = request.OfferingId.HasValue
            ? await _context.CourseOfferings.AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == request.OfferingId.Value && o.OrganizationId == organizationId)
            : null;

        var isAssignee = task.AssigneeId == userId;
        var isCreator = task.CreatedByUserId == userId;
        var isCoursework = task.OfferingId.HasValue || task.AssignmentBatchId.HasValue;
        var canTeachOffering = task.OfferingId.HasValue &&
            await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                _context, organizationId, userId, task.OfferingId.Value);

        if (isCoursework && isAssignee && !isCreator)
        {
            task.IsCompleted = request.IsCompleted;
            if (!request.IsCompleted)
            {
                task.SubmissionUrl = null;
                task.SubmissionAttachmentsJson = null;
            }
            else
            {
                task.SubmissionUrl = string.IsNullOrWhiteSpace(request.SubmissionUrl) ? null : request.SubmissionUrl;
                if (request.SubmissionAttachments != null)
                {
                    task.SubmissionAttachmentsJson = TaskAttachmentJson.Serialize(
                        StampAttachments(request.SubmissionAttachments, userId, "submission"));
                }
            }
        }
        else
        {
            task.Title = request.Title;
            task.Description = request.Description;
            task.IsCompleted = request.IsCompleted;
            task.DueDate = request.DueDate;
            task.Priority = request.Priority;
            task.ProjectId = request.ProjectId;
            task.SubjectId = request.SubjectId ?? offering?.SubjectCatalogGroupId;
            task.PeriodId = offering?.PeriodId ?? task.PeriodId;
            task.OfferingId = request.OfferingId;
            task.GradeCategoryId = request.GradeCategoryId;
            task.MaxScore = request.MaxScore;
            task.Weight = request.Weight;
            task.ReferenceUrl = request.ReferenceUrl;
            if (request.Materials != null)
            {
                task.MaterialsJson = TaskAttachmentJson.Serialize(
                    StampAttachments(request.Materials, userId, "material"));
            }

            if (isCreator || !isCoursework)
            {
                task.SubmissionUrl = request.SubmissionUrl;
                if (request.SubmissionAttachments != null)
                {
                    task.SubmissionAttachmentsJson = TaskAttachmentJson.Serialize(
                        StampAttachments(request.SubmissionAttachments, userId, "submission"));
                }
            }

            if (isCreator || canTeachOffering)
            {
                task.TeacherFeedback = request.TeacherFeedback;
                task.Grade = request.Grade;
            }

            if (request.AssigneeId.HasValue && !task.OfferingId.HasValue)
                task.AssigneeId = request.AssigneeId.Value;
        }

        _taskRepository.Update(task);
        await _uow.CompleteAsync();

        var dto = (await MapTasksAsync(organizationId, new[] { task })).First();
        return new ServiceResponse<TaskItemDto>(true, dto);
    }

    public async Task<ServiceResponse<TaskItemDto>> SubmitTaskSubmissionAsync(
        Guid id,
        SubmitTaskSubmissionRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var task = await _taskRepository.GetByIdForUserMutationAsync(id, organizationId, userId);
        if (task == null)
            return new ServiceResponse<TaskItemDto>(false, null, new AppError(ErrorCodes.NotFound, "Task not found"));

        if (task.AssigneeId != userId)
        {
            return new ServiceResponse<TaskItemDto>(
                false,
                null,
                new AppError(ErrorCodes.Forbidden, "Only the assigned student can submit this coursework."));
        }

        if (task.Grade != null)
        {
            return new ServiceResponse<TaskItemDto>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, "This coursework has already been graded and cannot be changed."));
        }

        task.IsCompleted = request.IsCompleted;
        if (!request.IsCompleted)
        {
            task.SubmissionUrl = null;
            task.SubmissionAttachmentsJson = null;
        }
        else
        {
            task.SubmissionUrl = string.IsNullOrWhiteSpace(request.SubmissionUrl) ? null : request.SubmissionUrl;
            if (request.SubmissionAttachments != null)
            {
                task.SubmissionAttachmentsJson = TaskAttachmentJson.Serialize(
                    StampAttachments(request.SubmissionAttachments, userId, "submission"));
            }
        }

        _taskRepository.Update(task);
        await _uow.CompleteAsync();

        var dto = (await MapTasksAsync(organizationId, new[] { task })).First();
        return new ServiceResponse<TaskItemDto>(true, dto);
    }

    public async Task<ServiceResponse<bool>> DeleteTaskAsync(Guid id)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var task = await _taskRepository.GetByIdForUserMutationAsync(id, organizationId, userId);
        if (task == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Task not found"));

        if (task.OfferingId.HasValue && task.CreatedByUserId != userId)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.Forbidden, "Only the creator can delete an offering assignment."));

        _taskRepository.Remove(task);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<CreateAssignmentBatchResultDto>> CreateAssignmentBatchAsync(
        CreateAssignmentBatchRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;
        var batchId = Guid.NewGuid();

        var gradeCategoryId = NormalizeOptionalId(request.GradeCategoryId);
        var categoryError = await ValidateGradeCategoryAsync(organizationId, request.OfferingId, gradeCategoryId);
        if (categoryError != null)
            return new ServiceResponse<CreateAssignmentBatchResultDto>(false, null, categoryError);

        List<Guid> targetUserIds;
        Guid? offeringId = null;
        Guid? subjectId = null;
        Guid? periodId = null;

        if (request.DistributionScope == TaskDistributionScope.OfferingEnrolled)
        {
            var offering = await _context.CourseOfferings.AsNoTracking()
                .FirstOrDefaultAsync(o =>
                    o.Id == request.OfferingId!.Value &&
                    o.OrganizationId == organizationId &&
                    !o.IsDeleted);

            if (offering == null)
                return new ServiceResponse<CreateAssignmentBatchResultDto>(
                    false, null, new AppError(ErrorCodes.NotFound, "Selected offering was not found."));

            offeringId = offering.Id;
            periodId = offering.PeriodId;
            subjectId = offering.SubjectCatalogGroupId;

            if (!await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                    _context, organizationId, userId, offering.Id))
            {
                return new ServiceResponse<CreateAssignmentBatchResultDto>(
                    false,
                    null,
                    new AppError(ErrorCodes.Forbidden, "You can only post coursework for courses you teach."));
            }

            targetUserIds = await _context.OfferingEnrollments
                .AsNoTracking()
                .Where(e =>
                    e.OrganizationId == organizationId &&
                    e.OfferingId == offering.Id &&
                    !e.IsDeleted)
                .Select(e => e.UserId)
                .Distinct()
                .ToListAsync();
        }
        else if (request.DistributionScope == TaskDistributionScope.GroupMembers)
        {
            if (!request.SubjectId.HasValue || request.SubjectId.Value == Guid.Empty)
            {
                return new ServiceResponse<CreateAssignmentBatchResultDto>(
                    false,
                    null,
                    new AppError(ErrorCodes.InvalidInput, "Select a group (class, lab, cohort) to assign to its members."));
            }

            subjectId = request.SubjectId;
            targetUserIds = await _context.GroupMembers
                .AsNoTracking()
                .Where(m => m.GroupId == request.SubjectId.Value)
                .Select(m => m.UserId)
                .Distinct()
                .ToListAsync();
        }
        else
        {
            return new ServiceResponse<CreateAssignmentBatchResultDto>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, "Distribution scope must be offering or group."));
        }

        var activeMemberIds = await _context.OrganizationMembers
            .AsNoTracking()
            .Where(m =>
                m.OrganizationId == organizationId &&
                m.IsActive &&
                targetUserIds.Contains(m.UserId))
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync();

        var skipped = Math.Max(0, targetUserIds.Distinct().Count() - activeMemberIds.Count);

        if (activeMemberIds.Count == 0)
        {
            return new ServiceResponse<CreateAssignmentBatchResultDto>(
                false,
                null,
                new AppError(ErrorCodes.InvalidInput, "No active members found for this audience."));
        }

        var tasks = activeMemberIds.Select(studentId => new TaskItem
        {
            OrganizationId = organizationId,
            CreatedByUserId = userId,
            AssigneeId = studentId,
            AssignmentBatchId = batchId,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            SubjectId = subjectId,
            PeriodId = periodId,
            OfferingId = offeringId,
            GradeCategoryId = gradeCategoryId,
            MaxScore = request.MaxScore,
            Weight = request.Weight,
            ReferenceUrl = request.ReferenceUrl,
            MaterialsJson = TaskAttachmentJson.Serialize(StampAttachments(request.Materials, userId, "material"))
        }).ToList();

        foreach (var task in tasks)
            await _taskRepository.AddAsync(task);

        await _uow.CompleteAsync();

        var sample = (await MapTasksAsync(organizationId, new[] { tasks[0] })).First();
        var result = new CreateAssignmentBatchResultDto
        {
            BatchId = batchId,
            CreatedCount = tasks.Count,
            SkippedCount = skipped,
            SampleTask = sample
        };

        return new ServiceResponse<CreateAssignmentBatchResultDto>(true, result);
    }

    public async Task<ServiceResponse<PagedResponse<AssignmentBatchSummaryDto>>> GetAssignmentBatchesAsync(
        PagedRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var teachingOfferingIds = await OfferingTeachingAuthorization.GetTeachingOfferingIdsAsync(
            _context,
            organizationId,
            userId);

        var batchQuery = _context.Tasks
            .AsNoTracking()
            .Where(t =>
                t.OrganizationId == organizationId &&
                t.AssignmentBatchId.HasValue &&
                (t.CreatedByUserId == userId ||
                 (t.OfferingId.HasValue && teachingOfferingIds.Contains(t.OfferingId.Value))));

        var grouped = batchQuery
            .GroupBy(t => t.AssignmentBatchId!.Value)
            .Select(g => new
            {
                BatchId = g.Key,
                Title = g.OrderBy(t => t.CreatedAt).Select(t => t.Title).FirstOrDefault() ?? "",
                Description = g.OrderBy(t => t.CreatedAt).Select(t => t.Description).FirstOrDefault(),
                OfferingId = g.Select(t => t.OfferingId).FirstOrDefault(),
                SubjectId = g.Select(t => t.SubjectId).FirstOrDefault(),
                DueDate = g.Select(t => t.DueDate).FirstOrDefault(),
                MaxScore = g.Select(t => t.MaxScore).FirstOrDefault(),
                Weight = g.Select(t => t.Weight).FirstOrDefault(),
                TotalAssigned = g.Count(),
                SubmittedCount = g.Count(t => t.IsCompleted),
                GradedCount = g.Count(t => t.Grade != null),
                CreatedAt = g.Min(t => t.CreatedAt)
            });

        var totalCount = await grouped.CountAsync();
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var rows = await grouped
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var offeringIds = rows.Where(r => r.OfferingId.HasValue).Select(r => r.OfferingId!.Value).Distinct().ToList();
        var groupIds = rows.Where(r => r.SubjectId.HasValue).Select(r => r.SubjectId!.Value).Distinct().ToList();

        var offeringNames = offeringIds.Count > 0
            ? await _context.CourseOfferings.AsNoTracking()
                .Where(o => o.OrganizationId == organizationId && offeringIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.Name)
            : new Dictionary<Guid, string>();

        var groupNames = await LoadGroupNamesAsync(organizationId, groupIds);

        var items = rows.Select(r =>
        {
            string? offeringName = null;
            if (r.OfferingId.HasValue && offeringNames.TryGetValue(r.OfferingId.Value, out var on))
                offeringName = on;

            string? groupName = null;
            if (r.SubjectId.HasValue && groupNames.TryGetValue(r.SubjectId.Value, out var gn))
                groupName = gn;

            var scope = r.OfferingId.HasValue
                ? TaskDistributionScope.OfferingEnrolled
                : TaskDistributionScope.GroupMembers;

            return new AssignmentBatchSummaryDto
            {
                BatchId = r.BatchId,
                Title = r.Title,
                Description = r.Description,
                DistributionScope = scope,
                OfferingId = r.OfferingId,
                OfferingName = offeringName,
                SubjectId = r.SubjectId,
                GroupName = groupName,
                DueDate = r.DueDate,
                MaxScore = r.MaxScore,
                Weight = r.Weight,
                TotalAssigned = r.TotalAssigned,
                SubmittedCount = r.SubmittedCount,
                GradedCount = r.GradedCount,
                CreatedAt = r.CreatedAt
            };
        }).ToList();

        return new ServiceResponse<PagedResponse<AssignmentBatchSummaryDto>>(true, new PagedResponse<AssignmentBatchSummaryDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<IEnumerable<AssignmentBatchSubmissionDto>>> GetAssignmentBatchSubmissionsAsync(
        Guid batchId)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var teachingOfferingIds = await OfferingTeachingAuthorization.GetTeachingOfferingIdsAsync(
            _context,
            organizationId,
            userId);

        var tasks = await _context.Tasks
            .AsNoTracking()
            .Where(t =>
                t.OrganizationId == organizationId &&
                t.AssignmentBatchId == batchId &&
                (t.CreatedByUserId == userId ||
                 (t.OfferingId.HasValue && teachingOfferingIds.Contains(t.OfferingId.Value))))
            .OrderBy(t => t.AssigneeId)
            .ToListAsync();

        if (tasks.Count == 0)
        {
            return new ServiceResponse<IEnumerable<AssignmentBatchSubmissionDto>>(
                false,
                null,
                new AppError(ErrorCodes.NotFound, "Assignment batch not found."));
        }

        var studentIds = tasks.Select(t => t.AssigneeId).Distinct().ToList();
        var studentNames = await _context.Users.AsNoTracking()
            .Where(u => studentIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName })
            .ToDictionaryAsync(x => x.Id, x => x.Name.Trim());

        var offeringId = tasks[0].OfferingId;
        var enrollmentCohorts = offeringId.HasValue
            ? await _context.OfferingEnrollments.AsNoTracking()
                .Where(e =>
                    e.OrganizationId == organizationId &&
                    e.OfferingId == offeringId.Value &&
                    !e.IsDeleted &&
                    studentIds.Contains(e.UserId))
                .Select(e => new { e.UserId, e.CohortGroupId })
                .ToListAsync()
            : new();

        var cohortByStudent = enrollmentCohorts
            .Where(e => e.CohortGroupId.HasValue)
            .GroupBy(e => e.UserId)
            .ToDictionary(g => g.Key, g => g.First().CohortGroupId);

        var cohortIds = enrollmentCohorts
            .Where(e => e.CohortGroupId.HasValue)
            .Select(e => e.CohortGroupId!.Value)
            .Distinct()
            .ToList();

        var cohortNames = cohortIds.Count > 0
            ? await LoadGroupNamesAsync(organizationId, cohortIds)
            : new Dictionary<Guid, string>();

        var items = tasks.Select(t =>
        {
            studentNames.TryGetValue(t.AssigneeId, out var name);
            Guid? cohortId = null;
            if (cohortByStudent.TryGetValue(t.AssigneeId, out var cid))
                cohortId = cid;

            string? cohortName = null;
            if (cohortId.HasValue && cohortNames.TryGetValue(cohortId.Value, out var gn))
                cohortName = gn;

            var isLate = t.IsCompleted &&
                t.DueDate.HasValue &&
                t.UpdatedAt > t.DueDate.Value;

            return new AssignmentBatchSubmissionDto
            {
                TaskId = t.Id,
                StudentUserId = t.AssigneeId,
                StudentName = string.IsNullOrWhiteSpace(name) ? "Student" : name,
                IsCompleted = t.IsCompleted,
                SubmissionUrl = t.SubmissionUrl,
                SubmissionAttachments = TaskAttachmentJson.Parse(t.SubmissionAttachmentsJson).ToList(),
                Grade = t.Grade,
                TeacherFeedback = t.TeacherFeedback,
                UpdatedAt = t.UpdatedAt,
                DueDate = t.DueDate,
                MaxScore = t.MaxScore,
                CohortGroupId = cohortId,
                CohortGroupName = cohortName,
                IsLate = isLate
            };
        }).ToList();

        return new ServiceResponse<IEnumerable<AssignmentBatchSubmissionDto>>(true, items);
    }

    public async Task<ServiceResponse<bool>> DeleteAssignmentBatchAsync(Guid batchId)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var teachingOfferingIds = await OfferingTeachingAuthorization.GetTeachingOfferingIdsAsync(
            _context,
            organizationId,
            userId);

        var tasks = await _context.Tasks
            .Where(t =>
                t.OrganizationId == organizationId &&
                t.AssignmentBatchId == batchId &&
                (t.CreatedByUserId == userId ||
                 (t.OfferingId.HasValue && teachingOfferingIds.Contains(t.OfferingId.Value))))
            .ToListAsync();

        if (tasks.Count == 0)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Assignment batch not found."));

        foreach (var task in tasks)
            _taskRepository.Remove(task);

        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    private static Guid? NormalizeOptionalId(Guid? id) =>
        id is { } value && value != Guid.Empty ? value : null;

    private async Task<AppError?> ValidateGradeCategoryAsync(
        Guid organizationId,
        Guid? offeringId,
        Guid? gradeCategoryId)
    {
        gradeCategoryId = NormalizeOptionalId(gradeCategoryId);
        if (!gradeCategoryId.HasValue)
            return null;

        if (!offeringId.HasValue)
            return new AppError(ErrorCodes.InvalidInput, "Select a course offering before choosing a grade category.");

        var category = await _context.OfferingGradeCategories.AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.Id == gradeCategoryId.Value &&
                c.OrganizationId == organizationId &&
                c.OfferingId == offeringId.Value &&
                !c.IsDeleted);

        return category == null
            ? new AppError(ErrorCodes.NotFound, "Grade category not found for this offering.")
            : null;
    }

    private async Task<AppError?> ValidateOfferingAsync(Guid organizationId, Guid? offeringId)
    {
        if (!offeringId.HasValue)
            return null;

        var exists = await _context.CourseOfferings.AnyAsync(o =>
            o.Id == offeringId.Value && o.OrganizationId == organizationId && !o.IsDeleted);

        return exists
            ? null
            : new AppError(ErrorCodes.NotFound, "Selected offering was not found.");
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
                GroupTypes.Program, GroupTypes.Series, GroupTypes.Group, GroupTypes.Subgroup,
                GroupTypes.Cohort, GroupTypes.Class, GroupTypes.Subject,
                GroupTypes.Team, GroupTypes.Project
            },
            _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                GroupTypes.Program, GroupTypes.Series, GroupTypes.Group, GroupTypes.Subgroup,
                GroupTypes.Cohort, GroupTypes.Class, GroupTypes.Subject,
                GroupTypes.Team, GroupTypes.Project
            }
        };
    }

    private async Task<List<TaskItemDto>> MapTasksAsync(Guid organizationId, IEnumerable<TaskItem> tasks)
    {
        var list = tasks.ToList();
        var groupIds = list.Where(t => t.SubjectId.HasValue).Select(t => t.SubjectId!.Value).Distinct();
        var offeringIds = list.Where(t => t.OfferingId.HasValue).Select(t => t.OfferingId!.Value).Distinct();
        var categoryIds = list.Where(t => t.GradeCategoryId.HasValue).Select(t => t.GradeCategoryId!.Value).Distinct();

        var groupNames = await LoadGroupNamesAsync(organizationId, groupIds);
        var offeringNames = offeringIds.Any()
            ? await _context.CourseOfferings.AsNoTracking()
                .Where(o => o.OrganizationId == organizationId && offeringIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.Name)
            : new Dictionary<Guid, string>();

        var categories = categoryIds.Any()
            ? await _context.OfferingGradeCategories.AsNoTracking()
                .Where(c => c.OrganizationId == organizationId && categoryIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => c)
            : new Dictionary<Guid, OfferingGradeCategory>();

        return list.Select(t => MapToDto(t, groupNames, offeringNames, categories)).ToList();
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

    private static TaskItemDto MapToDto(
        TaskItem t,
        IReadOnlyDictionary<Guid, string> groupNames,
        IReadOnlyDictionary<Guid, string> offeringNames,
        IReadOnlyDictionary<Guid, OfferingGradeCategory> categories)
    {
        string? groupName = null;
        if (t.SubjectId.HasValue && groupNames.TryGetValue(t.SubjectId.Value, out var name))
            groupName = name;

        string? offeringName = null;
        if (t.OfferingId.HasValue && offeringNames.TryGetValue(t.OfferingId.Value, out var oName))
            offeringName = oName;

        OfferingGradeCategory? category = null;
        if (t.GradeCategoryId.HasValue)
            categories.TryGetValue(t.GradeCategoryId.Value, out category);

        decimal? effectiveWeight = t.Weight;
        if (category != null && t.Weight.HasValue)
            effectiveWeight = category.Weight * t.Weight.Value;
        else if (category != null && !t.Weight.HasValue)
            effectiveWeight = null;

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
            PeriodId = t.PeriodId,
            OfferingId = t.OfferingId,
            AssignmentBatchId = t.AssignmentBatchId,
            GroupName = groupName ?? offeringName,
            OfferingName = offeringName,
            MaxScore = t.MaxScore,
            Weight = t.Weight,
            GradeCategoryId = t.GradeCategoryId,
            GradeCategoryName = category?.Name,
            CategoryWeight = category?.Weight,
            EffectiveWeight = effectiveWeight,
            ReferenceUrl = t.ReferenceUrl,
            Materials = TaskAttachmentJson.Parse(t.MaterialsJson).ToList(),
            SubmissionUrl = t.SubmissionUrl,
            SubmissionAttachments = TaskAttachmentJson.Parse(t.SubmissionAttachmentsJson).ToList(),
            TeacherFeedback = t.TeacherFeedback,
            Grade = t.Grade,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        };
    }

    private static List<TaskAttachmentDto>? StampAttachments(
        List<TaskAttachmentDto>? attachments,
        Guid userId,
        string defaultKind)
    {
        if (attachments == null)
            return null;

        return attachments
            .Where(a => !string.IsNullOrWhiteSpace(a.Url))
            .Select(a => new TaskAttachmentDto
            {
                Url = a.Url.Trim(),
                FileName = string.IsNullOrWhiteSpace(a.FileName) ? null : a.FileName.Trim(),
                ContentType = string.IsNullOrWhiteSpace(a.ContentType) ? null : a.ContentType.Trim(),
                Kind = string.IsNullOrWhiteSpace(a.Kind) ? defaultKind : a.Kind.Trim().ToLowerInvariant(),
                UploadedAt = a.UploadedAt ?? DateTime.UtcNow,
                UploadedByUserId = a.UploadedByUserId ?? userId
            })
            .ToList();
    }
}
