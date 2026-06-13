using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class OfferingGradePlanService : IOfferingGradePlanService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;

    public OfferingGradePlanService(
        ApplicationDbContext context,
        IUnitOfWork uow,
        IUserContext userContext)
    {
        _context = context;
        _uow = uow;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<OfferingGradePlanDto>> GetGradePlanAsync(Guid periodId, Guid offeringId)
    {
        var orgId = _userContext.OrganizationId;
        var offering = await _context.CourseOfferings.AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                o.PeriodId == periodId &&
                !o.IsDeleted);

        if (offering == null)
            return Fail(ErrorCodes.NotFound, "Offering not found.");

        if (!await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                _context, orgId, _userContext.UserId, offeringId))
            return Fail(ErrorCodes.Forbidden, "You are not on the teaching team for this offering.");

        return new ServiceResponse<OfferingGradePlanDto>(
            true,
            await BuildPlanDtoAsync(orgId, offeringId, offering.Name, _userContext.UserId));
    }

    public async Task<ServiceResponse<OfferingGradePlanDto>> SaveGradePlanAsync(
        Guid periodId,
        Guid offeringId,
        SaveOfferingGradePlanRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var offering = await _context.CourseOfferings
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                o.PeriodId == periodId &&
                !o.IsDeleted);

        if (offering == null)
            return Fail(ErrorCodes.NotFound, "Offering not found.");

        if (!await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                _context, orgId, _userContext.UserId, offeringId))
            return Fail(ErrorCodes.Forbidden, "You are not on the teaching team for this offering.");

        if (!await OfferingTeachingAuthorization.IsOfferingHostAsync(
                _context, orgId, _userContext.UserId, offeringId))
            return Fail(ErrorCodes.Forbidden, "Only the course host can change the grade breakdown.");

        var coreSum = request.Categories.Where(c => !c.IsBonus).Sum(c => c.Weight);
        if (coreSum > 1.0001m)
            return Fail(ErrorCodes.InvalidInput, "Core grade categories cannot exceed 100% of the final grade.");

        var existing = await _context.OfferingGradeCategories
            .Where(c => c.OfferingId == offeringId)
            .ToListAsync();

        var incomingIds = request.Categories
            .Where(c => c.Id.HasValue && c.Id.Value != Guid.Empty)
            .Select(c => c.Id!.Value)
            .ToHashSet();

        foreach (var row in existing.Where(e => !incomingIds.Contains(e.Id)))
            _uow.Repository<OfferingGradeCategory>().Remove(row);

        var sort = 0;
        foreach (var item in request.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name))
        {
            OfferingGradeCategory entity;
            if (item.Id.HasValue && item.Id.Value != Guid.Empty)
            {
                entity = existing.FirstOrDefault(e => e.Id == item.Id.Value);
                if (entity == null)
                    return Fail(ErrorCodes.NotFound, $"Grade category {item.Id} not found.");
            }
            else
            {
                entity = new OfferingGradeCategory { OrganizationId = orgId, OfferingId = offeringId };
                await _uow.Repository<OfferingGradeCategory>().AddAsync(entity);
            }

            entity.Name = item.Name.Trim();
            entity.Weight = item.Weight;
            entity.SortOrder = item.SortOrder > 0 ? item.SortOrder : sort++;
            entity.IsBonus = item.IsBonus;

            if (item.Id.HasValue && item.Id.Value != Guid.Empty)
                _uow.Repository<OfferingGradeCategory>().Update(entity);
        }

        await _uow.CompleteAsync();

        return new ServiceResponse<OfferingGradePlanDto>(
            true,
            await BuildPlanDtoAsync(orgId, offeringId, offering.Name, _userContext.UserId));
    }

    private async Task<OfferingGradePlanDto> BuildPlanDtoAsync(
        Guid orgId,
        Guid offeringId,
        string offeringName,
        Guid userId)
    {
        var categories = await _context.OfferingGradeCategories.AsNoTracking()
            .Where(c => c.OfferingId == offeringId && !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        var categoryIds = categories.Select(c => c.Id).ToList();

        var tasks = categoryIds.Count == 0
            ? new List<TaskItem>()
            : await _context.Tasks.AsNoTracking()
                .Where(t =>
                    t.OfferingId == offeringId &&
                    t.GradeCategoryId.HasValue &&
                    categoryIds.Contains(t.GradeCategoryId.Value) &&
                    !t.IsDeleted)
                .OrderBy(t => t.DueDate)
                .ThenBy(t => t.Title)
                .ToListAsync();

        var tasksByCategory = tasks
            .GroupBy(t => t.GradeCategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var categoryDtos = categories.Select(c =>
        {
            var linked = tasksByCategory.GetValueOrDefault(c.Id) ?? new List<TaskItem>();
            var assignedSum = linked.Where(t => t.Weight.HasValue).Sum(t => t.Weight!.Value);
            return new OfferingGradeCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Weight = c.Weight,
                SortOrder = c.SortOrder,
                IsBonus = c.IsBonus,
                AssignedWeightSum = assignedSum,
                Tasks = linked
                    .GroupBy(t => t.AssignmentBatchId ?? t.Id)
                    .Select(g => g.OrderBy(t => t.CreatedAt).First())
                    .Select(t => new GradePlanTaskItemDto
                    {
                        Id = t.Id,
                        Title = t.Title,
                        AssignmentBatchId = t.AssignmentBatchId,
                        Weight = t.Weight,
                        MaxScore = t.MaxScore,
                        DueDate = t.DueDate
                    })
                    .ToList()
            };
        }).ToList();

        var canEdit = await OfferingTeachingAuthorization.IsOfferingHostAsync(
            _context, orgId, userId, offeringId);

        return new OfferingGradePlanDto
        {
            OfferingId = offeringId,
            OfferingName = offeringName,
            Categories = categoryDtos,
            CoreWeightSum = categories.Where(c => !c.IsBonus).Sum(c => c.Weight),
            BonusWeightSum = categories.Where(c => c.IsBonus).Sum(c => c.Weight),
            CanEditGradePlan = canEdit
        };
    }

    private static ServiceResponse<OfferingGradePlanDto> Fail(string code, string message) =>
        new(false, null, new AppError(code, message));
}
