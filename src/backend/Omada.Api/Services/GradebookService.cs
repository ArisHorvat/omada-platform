using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Grading;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class GradebookService : IGradebookService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContext _userContext;

    public GradebookService(ApplicationDbContext context, IUserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<OfferingGradebookDto>> GetOfferingGradebookAsync(
        Guid periodId,
        Guid offeringId,
        Guid? cohortGroupId = null)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var offering = await _context.CourseOfferings.AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                o.PeriodId == periodId &&
                !o.IsDeleted);

        if (offering == null)
            return FailGradebook(ErrorCodes.NotFound, "Offering not found.");

        if (!await OfferingTeachingAuthorization.CanTeachOfferingAsync(_context, orgId, userId, offeringId))
            return FailGradebook(ErrorCodes.Forbidden, "You are not on the teaching team for this offering.");

        var enrollmentsQuery = _context.OfferingEnrollments.AsNoTracking()
            .Include(e => e.User)
            .Include(e => e.CohortGroup)
            .Where(e => e.OfferingId == offeringId && e.OrganizationId == orgId && !e.IsDeleted);

        if (cohortGroupId.HasValue)
            enrollmentsQuery = enrollmentsQuery.Where(e => e.CohortGroupId == cohortGroupId.Value);

        var enrollments = await enrollmentsQuery
            .OrderBy(e => e.User.LastName)
            .ThenBy(e => e.User.FirstName)
            .ToListAsync();

        var allEnrollments = await _context.OfferingEnrollments.AsNoTracking()
            .Include(e => e.CohortGroup)
            .Where(e => e.OfferingId == offeringId && e.OrganizationId == orgId && !e.IsDeleted)
            .ToListAsync();

        var cohortOptions = allEnrollments
            .Where(e => e.CohortGroupId.HasValue && e.CohortGroup != null)
            .GroupBy(e => e.CohortGroupId!.Value)
            .Select(g => new GradebookCohortOptionDto
            {
                Id = g.Key,
                Name = g.First().CohortGroup!.Name
            })
            .OrderBy(c => c.Name)
            .ToList();

        var studentIds = enrollments.Select(e => e.UserId).ToHashSet();
        var tasks = await LoadCourseworkTasksAsync(orgId, offeringId);
        var categories = await LoadCategoriesForTasksAsync(orgId, tasks);
        var utcNow = DateTime.UtcNow;

        var students = enrollments.Select(enrollment =>
        {
            var studentTasks = tasks.Where(t => t.AssigneeId == enrollment.UserId).ToList();
            var stats = BuildStats(studentTasks, utcNow);

            return new GradebookStudentSummaryDto
            {
                UserId = enrollment.UserId,
                DisplayName = FormatDisplayName(enrollment.User),
                CohortGroupId = enrollment.CohortGroupId,
                CohortGroupName = enrollment.CohortGroup?.Name,
                GradeSoFarTen = CourseworkTenScale.ComputeWeightedTenGrade(studentTasks, categories),
                GradedCount = stats.Graded,
                TotalAssignments = stats.Total,
                SubmittedCount = stats.Submitted,
                OverdueCount = stats.Overdue,
                PendingCount = stats.Pending
            };
        }).ToList();

        return new ServiceResponse<OfferingGradebookDto>(true, new OfferingGradebookDto
        {
            OfferingId = offering.Id,
            OfferingName = offering.Name,
            OfferingCode = offering.Code,
            PeriodId = offering.PeriodId,
            Credits = offering.Credits,
            CohortOptions = cohortOptions,
            Students = students
        });
    }

    public async Task<ServiceResponse<StudentOfferingGradeBreakdownDto>> GetStudentBreakdownAsync(
        Guid periodId,
        Guid offeringId,
        Guid studentUserId)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var offering = await _context.CourseOfferings.AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                o.PeriodId == periodId &&
                !o.IsDeleted);

        if (offering == null)
            return FailBreakdown(ErrorCodes.NotFound, "Offering not found.");

        if (!await OfferingTeachingAuthorization.CanTeachOfferingAsync(_context, orgId, userId, offeringId))
            return FailBreakdown(ErrorCodes.Forbidden, "You are not on the teaching team for this offering.");

        var enrollment = await _context.OfferingEnrollments.AsNoTracking()
            .Include(e => e.User)
            .FirstOrDefaultAsync(e =>
                e.OfferingId == offeringId &&
                e.OrganizationId == orgId &&
                e.UserId == studentUserId &&
                !e.IsDeleted);

        if (enrollment == null)
            return FailBreakdown(ErrorCodes.NotFound, "Student is not enrolled in this offering.");

        var tasks = (await LoadCourseworkTasksAsync(orgId, offeringId))
            .Where(t => t.AssigneeId == studentUserId)
            .ToList();

        var categories = await LoadCategoriesForTasksAsync(orgId, tasks);
        var utcNow = DateTime.UtcNow;
        var stats = BuildStats(tasks, utcNow);
        var categoryBreakdown = BuildCategoryBreakdown(tasks, categories, utcNow);

        return new ServiceResponse<StudentOfferingGradeBreakdownDto>(true, new StudentOfferingGradeBreakdownDto
        {
            UserId = studentUserId,
            DisplayName = FormatDisplayName(enrollment.User),
            OfferingId = offering.Id,
            CourseName = offering.Name,
            CourseCode = offering.Code,
            GradeSoFarTen = CourseworkTenScale.ComputeWeightedTenGrade(tasks, categories),
            Credits = offering.Credits,
            Stats = stats,
            Categories = categoryBreakdown
        });
    }

    private async Task<List<TaskItem>> LoadCourseworkTasksAsync(Guid orgId, Guid offeringId)
    {
        return await _context.Tasks.AsNoTracking()
            .Where(t =>
                t.OrganizationId == orgId &&
                t.OfferingId == offeringId &&
                t.AssignmentBatchId != null)
            .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenBy(t => t.Title)
            .ToListAsync();
    }

    private async Task<Dictionary<Guid, OfferingGradeCategory>> LoadCategoriesForTasksAsync(
        Guid orgId,
        IEnumerable<TaskItem> tasks)
    {
        var categoryIds = tasks
            .Where(t => t.GradeCategoryId.HasValue)
            .Select(t => t.GradeCategoryId!.Value)
            .Distinct()
            .ToList();

        if (categoryIds.Count == 0)
            return new Dictionary<Guid, OfferingGradeCategory>();

        return await _context.OfferingGradeCategories.AsNoTracking()
            .Where(c => c.OrganizationId == orgId && categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id);
    }

    private static GradebookStatsDto BuildStats(IReadOnlyList<TaskItem> tasks, DateTime utcNow)
    {
        var graded = 0;
        var submitted = 0;
        var overdue = 0;
        var pending = 0;

        foreach (var task in tasks)
        {
            var status = CourseworkTenScale.ResolveAssignmentStatus(task, utcNow);
            switch (status)
            {
                case "graded":
                    graded += 1;
                    break;
                case "submitted":
                    submitted += 1;
                    break;
                case "overdue":
                    overdue += 1;
                    break;
                default:
                    pending += 1;
                    break;
            }
        }

        return new GradebookStatsDto
        {
            Total = tasks.Count,
            Graded = graded,
            Pending = pending,
            Submitted = submitted,
            Overdue = overdue
        };
    }

    private static List<GradebookCategoryBreakdownDto> BuildCategoryBreakdown(
        IReadOnlyList<TaskItem> tasks,
        IReadOnlyDictionary<Guid, OfferingGradeCategory> categories,
        DateTime utcNow)
    {
        var buckets = new Dictionary<string, List<TaskItem>>(StringComparer.OrdinalIgnoreCase);

        foreach (var task in tasks)
        {
            categories.TryGetValue(task.GradeCategoryId ?? Guid.Empty, out var category);
            var name = string.IsNullOrWhiteSpace(category?.Name) ? "Other" : category!.Name.Trim();
            if (!buckets.TryGetValue(name, out var list))
            {
                list = new List<TaskItem>();
                buckets[name] = list;
            }

            list.Add(task);
        }

        return buckets
            .Select(pair =>
            {
                var rows = pair.Value
                    .Select(t => MapAssignmentRow(t, categories, utcNow))
                    .ToList();

                var sample = pair.Value.FirstOrDefault();
                OfferingGradeCategory? sampleCategory = null;
                if (sample?.GradeCategoryId is { } cid)
                    categories.TryGetValue(cid, out sampleCategory);

                var weight = sampleCategory?.Weight ?? sample?.Weight;
                string? weightLabel = null;
                if (weight is > 0)
                {
                    var pct = weight <= 1 ? weight.Value * 100 : weight.Value;
                    weightLabel = $"{Math.Round(pct, 1)}%";
                }

                return new GradebookCategoryBreakdownDto
                {
                    Id = pair.Key.ToLowerInvariant().Replace(' ', '-'),
                    Name = pair.Key,
                    WeightLabel = weightLabel,
                    CategoryAverageTen = CourseworkTenScale.ComputeWeightedTenGrade(pair.Value, categories),
                    Assignments = rows
                };
            })
            .OrderBy(c => c.Name)
            .ToList();
    }

    private static GradebookAssignmentRowDto MapAssignmentRow(
        TaskItem task,
        IReadOnlyDictionary<Guid, OfferingGradeCategory> categories,
        DateTime utcNow)
    {
        categories.TryGetValue(task.GradeCategoryId ?? Guid.Empty, out var category);

        decimal? effectiveWeight = task.Weight;
        if (category != null && task.Weight.HasValue)
            effectiveWeight = category.Weight * task.Weight.Value;
        else if (category != null && !task.Weight.HasValue)
            effectiveWeight = null;

        var isLate = task.IsCompleted &&
            task.DueDate.HasValue &&
            task.UpdatedAt > task.DueDate.Value;

        return new GradebookAssignmentRowDto
        {
            TaskId = task.Id,
            Title = task.Title,
            AssignmentBatchId = task.AssignmentBatchId,
            DueDate = task.DueDate,
            MaxScore = task.MaxScore,
            Weight = task.Weight,
            EffectiveWeight = effectiveWeight,
            Grade = task.Grade,
            GradeTen = task.Grade.HasValue ? CourseworkTenScale.ScoreToTenScale(task.Grade.Value, task.MaxScore) : null,
            IsCompleted = task.IsCompleted,
            IsLate = isLate,
            TeacherFeedback = task.TeacherFeedback,
            Status = CourseworkTenScale.ResolveAssignmentStatus(task, utcNow)
        };
    }

    private static string FormatDisplayName(User user) =>
        $"{user.FirstName} {user.LastName}".Trim();

    private static ServiceResponse<OfferingGradebookDto> FailGradebook(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static ServiceResponse<StudentOfferingGradeBreakdownDto> FailBreakdown(string code, string message) =>
        new(false, null, new AppError(code, message));
}
