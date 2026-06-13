using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class CourseOfferingService : ICourseOfferingService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IGroupScopeService _groupScope;
    private readonly IOfferingTimetableService _timetableService;

    public CourseOfferingService(
        ApplicationDbContext context,
        IUnitOfWork uow,
        IUserContext userContext,
        IGroupScopeService groupScope,
        IOfferingTimetableService timetableService)
    {
        _context = context;
        _uow = uow;
        _userContext = userContext;
        _groupScope = groupScope;
        _timetableService = timetableService;
    }

    public async Task<ServiceResponse<CurrentOrganizationPeriodDto>> GetCurrentPeriodAsync()
    {
        var orgId = _userContext.OrganizationId;
        var current = await _context.OrganizationPeriods
            .AsNoTracking()
            .Where(p => p.OrganizationId == orgId && p.IsCurrent && !p.IsDeleted)
            .OrderByDescending(p => p.StartDate)
            .FirstOrDefaultAsync();

        return new ServiceResponse<CurrentOrganizationPeriodDto>(true, new CurrentOrganizationPeriodDto
        {
            PeriodId = current?.Id,
            PeriodName = current?.Name
        });
    }

    public async Task<ServiceResponse<IEnumerable<OrganizationPeriodDto>>> GetOrganizationPeriodsAsync()
    {
        var orgId = _userContext.OrganizationId;
        var periods = await _context.OrganizationPeriods
            .AsNoTracking()
            .Where(p => p.OrganizationId == orgId && !p.IsDeleted)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new OrganizationPeriodDto
            {
                Id = p.Id,
                Name = p.Name,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                IsCurrent = p.IsCurrent
            })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<OrganizationPeriodDto>>(true, periods);
    }

    public async Task<ServiceResponse<IEnumerable<CourseOfferingDto>>> GetOfferingsForPeriodAsync(Guid periodId)
    {
        var orgId = _userContext.OrganizationId;
        if (!await PeriodExistsAsync(orgId, periodId))
            return FailOfferings(ErrorCodes.NotFound, "Period not found.");

        var rows = await _context.CourseOfferings
            .AsNoTracking()
            .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId)
            .OrderBy(o => o.Name)
            .Select(o => new
            {
                Entity = o,
                EnrollmentCount = o.Enrollments.Count(e => !e.IsDeleted)
            })
            .ToListAsync();

        var dtos = new List<CourseOfferingDto>();
        foreach (var row in rows)
            dtos.Add(await MapOfferingAsync(row.Entity.Id, row.EnrollmentCount));

        return new ServiceResponse<IEnumerable<CourseOfferingDto>>(true, dtos);
    }

    public async Task<ServiceResponse<CourseOfferingDto>> CreateOfferingAsync(Guid periodId, CreateCourseOfferingRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await PeriodExistsAsync(orgId, periodId))
            return FailOffering(ErrorCodes.NotFound, "Period not found.");

        var validation = await ValidateOfferingGroupsAsync(orgId, request.ProgramGroupId, request.SubjectCatalogGroupId);
        if (validation != null)
            return FailOffering(validation.Code, validation.Message);

        var programIds = ResolveProgramGroupIds(request.ProgramGroupId, request.ProgramGroupIds);
        var programValidation = await ValidateProgramGroupIdsAsync(orgId, programIds);
        if (programValidation != null)
            return FailOffering(programValidation.Code, programValidation.Message);

        var entity = new CourseOffering
        {
            OrganizationId = orgId,
            PeriodId = periodId,
            Name = request.Name.Trim(),
            Code = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code.Trim(),
            Description = request.Description,
            ProgramGroupId = programIds.FirstOrDefault(),
            SubjectCatalogGroupId = request.SubjectCatalogGroupId,
            HostId = request.HostId,
            WeeklySessionPlanJson = OfferingSessionPlanJson.Serialize(request.WeeklySessions),
            Credits = request.Credits,
            RequiredAttendancePercent = request.RequiredAttendancePercent
        };

        await _uow.Repository<CourseOffering>().AddAsync(entity);
        await _uow.CompleteAsync();

        await SyncOfferingProgramsAsync(orgId, entity.Id, programIds);
        await SyncOfferingInstructorsAsync(orgId, entity.Id, request.Instructors, request.HostId);
        await _uow.CompleteAsync();

        return new ServiceResponse<CourseOfferingDto>(true, await MapOfferingAsync(entity.Id, 0));
    }

    public async Task<ServiceResponse<CourseOfferingDto>> UpdateOfferingAsync(
        Guid periodId,
        Guid offeringId,
        UpdateCourseOfferingRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _uow.Repository<CourseOffering>().GetQueryable()
            .FirstOrDefaultAsync(o => o.Id == offeringId && o.OrganizationId == orgId && o.PeriodId == periodId);

        if (entity == null)
            return FailOffering(ErrorCodes.NotFound, "Offering not found.");

        var validation = await ValidateOfferingGroupsAsync(orgId, request.ProgramGroupId, request.SubjectCatalogGroupId);
        if (validation != null)
            return FailOffering(validation.Code, validation.Message);

        var programIds = ResolveProgramGroupIds(request.ProgramGroupId, request.ProgramGroupIds);
        var programValidation = await ValidateProgramGroupIdsAsync(orgId, programIds);
        if (programValidation != null)
            return FailOffering(programValidation.Code, programValidation.Message);

        entity.Name = request.Name.Trim();
        entity.Code = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code.Trim();
        entity.Description = request.Description;
        entity.ProgramGroupId = programIds.FirstOrDefault();
        entity.SubjectCatalogGroupId = request.SubjectCatalogGroupId;
        entity.HostId = request.HostId;
        entity.Credits = request.Credits;
        entity.RequiredAttendancePercent = request.RequiredAttendancePercent;
        if (request.WeeklySessions != null)
            entity.WeeklySessionPlanJson = OfferingSessionPlanJson.Serialize(request.WeeklySessions);

        _uow.Repository<CourseOffering>().Update(entity);
        await SyncOfferingProgramsAsync(orgId, entity.Id, programIds);
        await SyncOfferingInstructorsAsync(orgId, entity.Id, request.Instructors, request.HostId);
        await _uow.CompleteAsync();

        var count = await _context.OfferingEnrollments.CountAsync(e => e.OfferingId == offeringId && !e.IsDeleted);
        return new ServiceResponse<CourseOfferingDto>(true, await MapOfferingAsync(entity.Id, count));
    }

    public async Task<ServiceResponse<bool>> DeleteOfferingAsync(Guid periodId, Guid offeringId)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _uow.Repository<CourseOffering>().GetQueryable()
            .FirstOrDefaultAsync(o => o.Id == offeringId && o.OrganizationId == orgId && o.PeriodId == periodId);

        if (entity == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Offering not found."));

        _uow.Repository<CourseOffering>().Remove(entity);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<IEnumerable<OfferingEnrollmentDto>>> GetEnrollmentsAsync(Guid periodId, Guid offeringId)
    {
        var orgId = _userContext.OrganizationId;
        if (!await OfferingExistsAsync(orgId, periodId, offeringId))
            return FailEnrollments(ErrorCodes.NotFound, "Offering not found.");

        var rows = await _context.OfferingEnrollments
            .AsNoTracking()
            .Include(e => e.User)
            .Include(e => e.CohortGroup)
            .Where(e => e.OfferingId == offeringId && e.OrganizationId == orgId)
            .OrderBy(e => e.User.LastName)
            .ThenBy(e => e.User.FirstName)
            .ToListAsync();

        return new ServiceResponse<IEnumerable<OfferingEnrollmentDto>>(true, rows.Select(MapEnrollment));
    }

    public async Task<ServiceResponse<int>> EnrollCohortAsync(Guid periodId, Guid offeringId, EnrollCohortRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await OfferingExistsAsync(orgId, periodId, offeringId))
            return FailCount(ErrorCodes.NotFound, "Offering not found.");

        var cohort = await _context.Groups.AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == request.CohortGroupId && g.OrganizationId == orgId && !g.IsDeleted);

        if (cohort == null)
            return FailCount(ErrorCodes.NotFound, "Cohort group not found.");

        if (!GroupTypes.IsStudentGroup(cohort.Type))
            return FailCount(ErrorCodes.InvalidInput, "Selected group is not a student group.");

        var memberIds = (await _groupScope.GetMemberUserIdsInScopeAsync(orgId, cohort.Id)).ToList();

        var added = await EnrollUsersInternalAsync(orgId, offeringId, memberIds, cohort.Id);
        return new ServiceResponse<int>(true, added);
    }

    public async Task<ServiceResponse<int>> EnrollProgramCohortsAsync(
        Guid periodId,
        Guid offeringId,
        EnrollProgramCohortsRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await OfferingExistsAsync(orgId, periodId, offeringId))
            return FailCount(ErrorCodes.NotFound, "Offering not found.");

        var cohortIds = await GetStudentGroupIdsUnderProgramAsync(orgId, request.ProgramGroupId);
        if (cohortIds.Count == 0)
            return FailCount(ErrorCodes.InvalidInput, "No student groups found under this program.");

        var total = 0;
        foreach (var cohortId in cohortIds)
        {
            var memberIds = (await _groupScope.GetMemberUserIdsInScopeAsync(orgId, cohortId)).ToList();
            total += await EnrollUsersInternalAsync(orgId, offeringId, memberIds, cohortId);
        }

        return new ServiceResponse<int>(true, total);
    }

    public async Task<ServiceResponse<int>> EnrollLinkedProgramsAsync(
        Guid periodId,
        Guid offeringId,
        EnrollLinkedProgramsRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await OfferingExistsAsync(orgId, periodId, offeringId))
            return FailCount(ErrorCodes.NotFound, "Offering not found.");

        var programIds = await GetLinkedProgramIdsAsync(offeringId);
        if (programIds.Count == 0)
            return FailCount(ErrorCodes.InvalidInput, "Link at least one program to this offering first.");

        var total = 0;
        foreach (var programId in programIds)
        {
            var cohortIds = await GetStudentGroupIdsUnderProgramAsync(orgId, programId);
            foreach (var groupId in cohortIds)
            {
                var memberIds = (await _groupScope.GetMemberUserIdsInScopeAsync(orgId, groupId)).ToList();
                total += await EnrollUsersInternalAsync(orgId, offeringId, memberIds, groupId);
            }
        }

        return new ServiceResponse<int>(true, total);
    }

    public async Task<ServiceResponse<SetupProgramTermResultDto>> SetupProgramTermAsync(
        Guid periodId,
        SetupProgramTermRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await PeriodExistsAsync(orgId, periodId))
            return FailSetup(ErrorCodes.NotFound, "Period not found.");

        var program = await _context.Groups.AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == request.ProgramGroupId && g.OrganizationId == orgId && !g.IsDeleted);

        if (program == null)
            return FailSetup(ErrorCodes.NotFound, "Program group not found.");

        var names = request.OfferingNames?.Where(n => !string.IsNullOrWhiteSpace(n)).Select(n => n.Trim()).Distinct().ToList()
                    ?? new List<string>();

        if (names.Count == 0)
        {
            names = await _context.CourseOfferings.AsNoTracking()
                .Where(o => o.OrganizationId == orgId && o.ProgramGroupId == request.ProgramGroupId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => o.Name)
                .Distinct()
                .Take(20)
                .ToListAsync();
        }

        if (names.Count == 0)
            return FailSetup(ErrorCodes.InvalidInput, "Provide offering names or create offerings in a prior period first.");

        var offeringsCreated = 0;
        var enrollmentsCreated = 0;
        var offeringIds = new List<Guid>();

        foreach (var name in names)
        {
            var exists = await _context.CourseOfferings.AnyAsync(o =>
                o.OrganizationId == orgId && o.PeriodId == periodId && o.ProgramGroupId == request.ProgramGroupId &&
                o.Name == name);

            if (exists)
            {
                var existingId = await _context.CourseOfferings
                    .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId && o.ProgramGroupId == request.ProgramGroupId && o.Name == name)
                    .Select(o => o.Id)
                    .FirstAsync();
                offeringIds.Add(existingId);
                continue;
            }

            var entity = new CourseOffering
            {
                OrganizationId = orgId,
                PeriodId = periodId,
                ProgramGroupId = request.ProgramGroupId,
                Name = name
            };
            await _uow.Repository<CourseOffering>().AddAsync(entity);
            await _uow.CompleteAsync();
            offeringsCreated++;
            offeringIds.Add(entity.Id);
        }

        if (request.EnrollAllCohorts)
        {
            var cohortIds = await GetStudentGroupIdsUnderProgramAsync(orgId, request.ProgramGroupId);
            foreach (var offeringId in offeringIds)
            {
                foreach (var cohortId in cohortIds)
                {
                    var memberIds = (await _groupScope.GetMemberUserIdsInScopeAsync(orgId, cohortId)).ToList();
                    enrollmentsCreated += await EnrollUsersInternalAsync(orgId, offeringId, memberIds, cohortId);
                }
            }
        }

        return new ServiceResponse<SetupProgramTermResultDto>(true, new SetupProgramTermResultDto
        {
            OfferingsCreated = offeringsCreated,
            EnrollmentsCreated = enrollmentsCreated
        });
    }

    public async Task<ServiceResponse<int>> RolloverOfferingsAsync(Guid targetPeriodId, RolloverOfferingsRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await PeriodExistsAsync(orgId, targetPeriodId))
            return FailCount(ErrorCodes.NotFound, "Target period not found.");
        if (!await PeriodExistsAsync(orgId, request.SourcePeriodId))
            return FailCount(ErrorCodes.NotFound, "Source period not found.");

        var source = await _context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && o.PeriodId == request.SourcePeriodId)
            .ToListAsync();

        var created = 0;
        foreach (var src in source)
        {
            var exists = await _context.CourseOfferings.AnyAsync(o =>
                o.OrganizationId == orgId && o.PeriodId == targetPeriodId && o.Name == src.Name &&
                o.ProgramGroupId == src.ProgramGroupId);
            if (exists) continue;

            var clone = new CourseOffering
            {
                OrganizationId = orgId,
                PeriodId = targetPeriodId,
                ProgramGroupId = src.ProgramGroupId,
                SubjectCatalogGroupId = src.SubjectCatalogGroupId,
                Name = src.Name,
                Code = src.Code,
                Description = src.Description,
                HostId = src.HostId
            };
            await _uow.Repository<CourseOffering>().AddAsync(clone);
            await _uow.CompleteAsync();

            var sourceProgramIds = await _context.CourseOfferingPrograms.AsNoTracking()
                .Where(p => p.OfferingId == src.Id && !p.IsDeleted)
                .Select(p => p.ProgramGroupId)
                .ToListAsync();
            if (sourceProgramIds.Count == 0 && src.ProgramGroupId.HasValue)
                sourceProgramIds.Add(src.ProgramGroupId.Value);
            await SyncOfferingProgramsAsync(orgId, clone.Id, sourceProgramIds);

            var sourceInstructors = await _context.OfferingInstructors.AsNoTracking()
                .Where(i => i.OfferingId == src.Id && !i.IsDeleted)
                .Select(i => new OfferingInstructorInputDto { UserId = i.UserId, Role = i.Role })
                .ToListAsync();
            await SyncOfferingInstructorsAsync(orgId, clone.Id, sourceInstructors, src.HostId);
            await _uow.CompleteAsync();

            created++;

            if (request.CopyEnrollments)
            {
                var enrollments = await _context.OfferingEnrollments.AsNoTracking()
                    .Where(e => e.OfferingId == src.Id)
                    .Select(e => new { e.UserId, e.CohortGroupId })
                    .ToListAsync();

                foreach (var e in enrollments)
                    await EnrollUsersInternalAsync(orgId, clone.Id, new[] { e.UserId }, e.CohortGroupId);
            }
        }

        return new ServiceResponse<int>(true, created);
    }

    public async Task<ServiceResponse<IEnumerable<OfferingPickerItemDto>>> GetAssignableOfferingsAsync(Guid? periodId)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        var resolvedPeriodId = periodId ?? await ResolveCurrentPeriodIdAsync(orgId);

        var teachingIds = await OfferingTeachingAuthorization.GetTeachingOfferingIdsAsync(
            _context,
            orgId,
            userId,
            resolvedPeriodId);

        if (teachingIds.Count == 0)
            return new ServiceResponse<IEnumerable<OfferingPickerItemDto>>(true, Array.Empty<OfferingPickerItemDto>());

        var offeringsQuery = _context.CourseOfferings.AsNoTracking()
            .Where(o =>
                o.OrganizationId == orgId &&
                !o.IsDeleted &&
                teachingIds.Contains(o.Id));

        if (resolvedPeriodId.HasValue)
            offeringsQuery = offeringsQuery.Where(o => o.PeriodId == resolvedPeriodId.Value);

        var items = await offeringsQuery
            .OrderByDescending(o => o.Period.StartDate)
            .ThenBy(o => o.Name)
            .Select(o => new OfferingPickerItemDto
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                PeriodId = o.PeriodId,
                PeriodName = o.Period.Name,
                ProgramGroupId = o.ProgramGroupId,
                Credits = o.Credits
            })
            .ToListAsync();
        return new ServiceResponse<IEnumerable<OfferingPickerItemDto>>(true, items);
    }

    public async Task<ServiceResponse<IEnumerable<OfferingPickerItemDto>>> GetMyEnrollmentsAsync(Guid? periodId)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var enrollmentOfferingIds = await _context.OfferingEnrollments.AsNoTracking()
            .Where(e => e.OrganizationId == orgId && e.UserId == userId && !e.IsDeleted)
            .Select(e => e.OfferingId)
            .ToListAsync();

        if (enrollmentOfferingIds.Count == 0)
            return new ServiceResponse<IEnumerable<OfferingPickerItemDto>>(true, Array.Empty<OfferingPickerItemDto>());

        var offeringsQuery = _context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && !o.IsDeleted && enrollmentOfferingIds.Contains(o.Id));

        if (periodId.HasValue)
            offeringsQuery = offeringsQuery.Where(o => o.PeriodId == periodId.Value);

        var items = await offeringsQuery
            .OrderByDescending(o => o.Period.StartDate)
            .ThenBy(o => o.Name)
            .Select(o => new OfferingPickerItemDto
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                PeriodId = o.PeriodId,
                PeriodName = o.Period.Name,
                ProgramGroupId = o.ProgramGroupId,
                Credits = o.Credits
            })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<OfferingPickerItemDto>>(true, items);
    }

    private IQueryable<OfferingPickerItemDto> BuildPickerQuery(Guid orgId, Guid periodId) =>
        _context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId)
            .OrderBy(o => o.Name)
            .Select(o => new OfferingPickerItemDto
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                PeriodId = o.PeriodId,
                PeriodName = o.Period.Name,
                ProgramGroupId = o.ProgramGroupId,
                Credits = o.Credits
            });

    private async Task<int> EnrollUsersInternalAsync(
        Guid orgId,
        Guid offeringId,
        IEnumerable<Guid> userIds,
        Guid? cohortGroupId)
    {
        var existing = (await _context.OfferingEnrollments
            .Where(e => e.OfferingId == offeringId)
            .Select(e => e.UserId)
            .ToListAsync()).ToHashSet();

        var added = 0;
        foreach (var userId in userIds.Distinct())
        {
            if (existing.Contains(userId))
                continue;

            await _uow.Repository<OfferingEnrollment>().AddAsync(new OfferingEnrollment
            {
                OrganizationId = orgId,
                OfferingId = offeringId,
                UserId = userId,
                CohortGroupId = cohortGroupId
            });
            added++;
        }

        if (added > 0)
        {
            await _uow.CompleteAsync();
            await _timetableService.SeedExpectedAttendanceAsync(offeringId);
        }

        return added;
    }

    private async Task<List<Guid>> GetStudentGroupIdsUnderProgramAsync(Guid orgId, Guid programGroupId)
    {
        var allGroups = await _context.Groups.AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted)
            .Select(g => new { g.Id, g.ParentGroupId, g.Type })
            .ToListAsync();

        var cohortIds = new HashSet<Guid>();
        var direct = allGroups
            .Where(g => g.ParentGroupId == programGroupId && GroupTypes.IsStudentGroup(g.Type))
            .Select(g => g.Id);
        foreach (var id in direct)
            cohortIds.Add(id);

        // One level deeper: program → department → cohort unlikely; BFS from program
        var childrenByParent = allGroups
            .Where(g => g.ParentGroupId.HasValue)
            .GroupBy(g => g.ParentGroupId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var queue = new Queue<Guid>();
        queue.Enqueue(programGroupId);
        while (queue.Count > 0)
        {
            var parentId = queue.Dequeue();
            if (!childrenByParent.TryGetValue(parentId, out var children))
                continue;
            foreach (var child in children)
            {
                if (GroupTypes.IsStudentGroup(child.Type))
                    cohortIds.Add(child.Id);
                queue.Enqueue(child.Id);
            }
        }

        return cohortIds.ToList();
    }

    private async Task<Guid?> ResolveCurrentPeriodIdAsync(Guid orgId) =>
        await _context.OrganizationPeriods.AsNoTracking()
            .Where(p => p.OrganizationId == orgId && p.IsCurrent && !p.IsDeleted)
            .OrderByDescending(p => p.StartDate)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();

    private async Task<bool> PeriodExistsAsync(Guid orgId, Guid periodId) =>
        await _context.OrganizationPeriods.AnyAsync(p => p.Id == periodId && p.OrganizationId == orgId && !p.IsDeleted);

    private async Task<bool> OfferingExistsAsync(Guid orgId, Guid periodId, Guid offeringId) =>
        await _context.CourseOfferings.AnyAsync(o =>
            o.Id == offeringId && o.OrganizationId == orgId && o.PeriodId == periodId && !o.IsDeleted);

    private async Task<AppError?> ValidateOfferingGroupsAsync(Guid orgId, Guid? programGroupId, Guid? subjectCatalogGroupId)
    {
        if (programGroupId.HasValue)
        {
            var program = await _context.Groups.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == programGroupId.Value && g.OrganizationId == orgId && !g.IsDeleted);
            if (program == null)
                return new AppError(ErrorCodes.NotFound, "Program group not found.");
        }

        if (subjectCatalogGroupId.HasValue)
        {
            var subject = await _context.Groups.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == subjectCatalogGroupId.Value && g.OrganizationId == orgId && !g.IsDeleted);
            if (subject == null)
                return new AppError(ErrorCodes.NotFound, "Subject catalog group not found.");
            var type = GroupTypes.Normalize(subject.Type);
            if (type != GroupTypes.Subject && type != GroupTypes.Program)
                return new AppError(ErrorCodes.InvalidInput, "Subject catalog must be a subject or program group.");
        }

        return null;
    }

    private async Task<CourseOfferingDto> MapOfferingAsync(Guid offeringId, int enrollmentCount)
    {
        var entity = await _context.CourseOfferings.AsNoTracking()
            .FirstAsync(o => o.Id == offeringId);

        var programLinks = await _context.CourseOfferingPrograms.AsNoTracking()
            .Where(p => p.OfferingId == offeringId && !p.IsDeleted)
            .Select(p => p.ProgramGroupId)
            .ToListAsync();

        var programIds = programLinks.Count > 0
            ? programLinks
            : entity.ProgramGroupId.HasValue ? new List<Guid> { entity.ProgramGroupId.Value } : new List<Guid>();

        var programNames = programIds.Count == 0
            ? new List<string>()
            : await _context.Groups.AsNoTracking()
                .Where(g => programIds.Contains(g.Id))
                .OrderBy(g => g.Name)
                .Select(g => g.Name)
                .ToListAsync();

        string? subjectName = null;
        if (entity.SubjectCatalogGroupId.HasValue)
        {
            subjectName = await _context.Groups.AsNoTracking()
                .Where(g => g.Id == entity.SubjectCatalogGroupId.Value)
                .Select(g => g.Name)
                .FirstOrDefaultAsync();
        }

        var instructorRows = await _context.OfferingInstructors.AsNoTracking()
            .Include(i => i.User)
            .Where(i => i.OfferingId == offeringId && !i.IsDeleted)
            .OrderByDescending(i => i.Role == OfferingInstructorRoles.Primary)
            .ThenBy(i => i.User.LastName)
            .ToListAsync();

        var instructors = instructorRows.Select(i => new OfferingInstructorDto
        {
            UserId = i.UserId,
            DisplayName = $"{i.User.FirstName} {i.User.LastName}".Trim(),
            Role = i.Role,
            IsPrimary = i.Role == OfferingInstructorRoles.Primary
        }).ToList();

        string? hostName = null;
        if (entity.HostId.HasValue)
        {
            hostName = instructors.FirstOrDefault(i => i.UserId == entity.HostId)?.DisplayName
                ?? await _context.Users.AsNoTracking()
                    .Where(u => u.Id == entity.HostId.Value)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefaultAsync();
        }

        return new CourseOfferingDto
        {
            Id = entity.Id,
            OrganizationId = entity.OrganizationId,
            PeriodId = entity.PeriodId,
            ProgramGroupId = programIds.FirstOrDefault(),
            ProgramGroupName = programNames.FirstOrDefault(),
            ProgramGroupIds = programIds,
            ProgramGroupNames = programNames,
            SubjectCatalogGroupId = entity.SubjectCatalogGroupId,
            SubjectCatalogGroupName = subjectName,
            Name = entity.Name,
            Code = entity.Code,
            Description = entity.Description,
            HostId = entity.HostId,
            HostName = hostName,
            Instructors = instructors,
            EnrollmentCount = enrollmentCount,
            Credits = entity.Credits,
            RequiredAttendancePercent = entity.RequiredAttendancePercent,
            TimetablePublishedAt = entity.TimetablePublishedAt,
            WeeklySessions = await EnrichWeeklySessionsAsync(entity.WeeklySessionPlanJson),
            CreatedAt = entity.CreatedAt
        };
    }

    private async Task<IReadOnlyList<OfferingWeeklySessionDto>> EnrichWeeklySessionsAsync(string? json)
    {
        var sessions = OfferingSessionPlanJson.Parse(json).ToList();
        if (sessions.Count == 0)
            return sessions;

        var typeIds = sessions.Where(s => s.EventTypeId.HasValue).Select(s => s.EventTypeId!.Value).Distinct().ToList();
        if (typeIds.Count == 0)
            return sessions;

        var typeNames = await _context.EventTypes.AsNoTracking()
            .Where(t => typeIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name);

        foreach (var session in sessions)
        {
            if (session.EventTypeId.HasValue &&
                typeNames.TryGetValue(session.EventTypeId.Value, out var typeName) &&
                string.IsNullOrWhiteSpace(session.EventTypeName))
            {
                session.EventTypeName = typeName;
            }
        }

        return sessions;
    }

    private static List<Guid> ResolveProgramGroupIds(Guid? legacyProgramId, List<Guid>? programGroupIds)
    {
        var ids = programGroupIds?.Where(id => id != Guid.Empty).Distinct().ToList() ?? new List<Guid>();
        if (legacyProgramId.HasValue && legacyProgramId.Value != Guid.Empty && !ids.Contains(legacyProgramId.Value))
            ids.Insert(0, legacyProgramId.Value);
        return ids;
    }

    private async Task<AppError?> ValidateProgramGroupIdsAsync(Guid orgId, IReadOnlyList<Guid> programGroupIds)
    {
        if (programGroupIds.Count == 0)
            return null;

        foreach (var programId in programGroupIds)
        {
            var group = await _context.Groups.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == programId && g.OrganizationId == orgId && !g.IsDeleted);
            if (group == null)
                return new AppError(ErrorCodes.NotFound, "Program group not found.");
            if (GroupTypes.Normalize(group.Type) != GroupTypes.Program)
                return new AppError(ErrorCodes.InvalidInput, "Linked groups must be program type.");
        }

        return null;
    }

    private async Task SyncOfferingProgramsAsync(Guid orgId, Guid offeringId, IReadOnlyList<Guid> programGroupIds)
    {
        var existing = await _context.CourseOfferingPrograms
            .Where(p => p.OfferingId == offeringId)
            .ToListAsync();

        _context.CourseOfferingPrograms.RemoveRange(existing);

        foreach (var programId in programGroupIds.Distinct())
        {
            await _context.CourseOfferingPrograms.AddAsync(new CourseOfferingProgram
            {
                OrganizationId = orgId,
                OfferingId = offeringId,
                ProgramGroupId = programId
            });
        }
    }

    private async Task SyncOfferingInstructorsAsync(
        Guid orgId,
        Guid offeringId,
        List<OfferingInstructorInputDto>? instructors,
        Guid? legacyHostId)
    {
        var existing = await _context.OfferingInstructors
            .Where(i => i.OfferingId == offeringId)
            .ToListAsync();
        _context.OfferingInstructors.RemoveRange(existing);

        var inputs = instructors?.Where(i => i.UserId != Guid.Empty).ToList() ?? new List<OfferingInstructorInputDto>();
        if (inputs.Count == 0 && legacyHostId.HasValue)
        {
            inputs.Add(new OfferingInstructorInputDto { UserId = legacyHostId.Value, Role = OfferingInstructorRoles.Primary });
        }

        var hasPrimary = inputs.Any(i => OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary);
        for (var idx = 0; idx < inputs.Count; idx++)
        {
            var input = inputs[idx];
            var role = OfferingInstructorRoles.Normalize(input.Role);
            if (!hasPrimary && idx == 0)
                role = OfferingInstructorRoles.Primary;

            await _context.OfferingInstructors.AddAsync(new OfferingInstructor
            {
                OrganizationId = orgId,
                OfferingId = offeringId,
                UserId = input.UserId,
                Role = role
            });
        }

        var offering = await _context.CourseOfferings.FirstAsync(o => o.Id == offeringId);
        offering.HostId = await _context.OfferingInstructors.AsNoTracking()
            .Where(i => i.OfferingId == offeringId && i.Role == OfferingInstructorRoles.Primary)
            .Select(i => (Guid?)i.UserId)
            .FirstOrDefaultAsync() ?? legacyHostId;
        _context.CourseOfferings.Update(offering);
    }

    private async Task<List<Guid>> GetLinkedProgramIdsAsync(Guid offeringId)
    {
        var linked = await _context.CourseOfferingPrograms.AsNoTracking()
            .Where(p => p.OfferingId == offeringId && !p.IsDeleted)
            .Select(p => p.ProgramGroupId)
            .ToListAsync();

        if (linked.Count > 0)
            return linked;

        var legacy = await _context.CourseOfferings.AsNoTracking()
            .Where(o => o.Id == offeringId)
            .Select(o => o.ProgramGroupId)
            .FirstOrDefaultAsync();

        return legacy.HasValue ? new List<Guid> { legacy.Value } : new List<Guid>();
    }

    private static OfferingEnrollmentDto MapEnrollment(OfferingEnrollment e) => new()
    {
        Id = e.Id,
        OfferingId = e.OfferingId,
        UserId = e.UserId,
        UserDisplayName = $"{e.User.FirstName} {e.User.LastName}".Trim(),
        CohortGroupId = e.CohortGroupId,
        CohortGroupName = e.CohortGroup?.Name
    };

    private static ServiceResponse<IEnumerable<CourseOfferingDto>> FailOfferings(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static ServiceResponse<CourseOfferingDto> FailOffering(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static ServiceResponse<IEnumerable<OfferingEnrollmentDto>> FailEnrollments(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static ServiceResponse<int> FailCount(string code, string message) =>
        new(false, 0, new AppError(code, message));

    private static ServiceResponse<SetupProgramTermResultDto> FailSetup(string code, string message) =>
        new(false, null, new AppError(code, message));
}
