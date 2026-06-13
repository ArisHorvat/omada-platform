using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class CourseOfferingPackageService : ICourseOfferingPackageService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly ICourseOfferingService _offeringService;

    public CourseOfferingPackageService(
        ApplicationDbContext context,
        IUnitOfWork uow,
        IUserContext userContext,
        ICourseOfferingService offeringService)
    {
        _context = context;
        _uow = uow;
        _userContext = userContext;
        _offeringService = offeringService;
    }

    public async Task<ServiceResponse<IEnumerable<CourseOfferingPackageDto>>> GetPackagesAsync()
    {
        var orgId = _userContext.OrganizationId;
        var ids = await _context.CourseOfferingPackages.AsNoTracking()
            .Where(p => p.OrganizationId == orgId)
            .OrderBy(p => p.Name)
            .Select(p => p.Id)
            .ToListAsync();

        var dtos = new List<CourseOfferingPackageDto>();
        foreach (var id in ids)
            dtos.Add(await MapPackageAsync(id));

        return new ServiceResponse<IEnumerable<CourseOfferingPackageDto>>(true, dtos);
    }

    public async Task<ServiceResponse<CourseOfferingPackageDto>> GetPackageByIdAsync(Guid packageId)
    {
        var orgId = _userContext.OrganizationId;
        var exists = await _context.CourseOfferingPackages.AnyAsync(p => p.Id == packageId && p.OrganizationId == orgId);
        if (!exists)
            return FailPackage(ErrorCodes.NotFound, "Package not found.");

        return new ServiceResponse<CourseOfferingPackageDto>(true, await MapPackageAsync(packageId));
    }

    public async Task<ServiceResponse<CourseOfferingPackageDto>> CreatePackageAsync(CreateCourseOfferingPackageRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var programError = await ValidateProgramGroupIdsAsync(orgId, request.ProgramGroupIds ?? new List<Guid>());
        if (programError != null)
            return FailPackage(programError.Code, programError.Message);

        var entity = new CourseOfferingPackage
        {
            OrganizationId = orgId,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        };

        await _uow.Repository<CourseOfferingPackage>().AddAsync(entity);
        await _uow.CompleteAsync();

        await SyncPackageProgramsAsync(orgId, entity.Id, request.ProgramGroupIds ?? new List<Guid>());
        await _uow.CompleteAsync();

        return new ServiceResponse<CourseOfferingPackageDto>(true, await MapPackageAsync(entity.Id));
    }

    public async Task<ServiceResponse<CourseOfferingPackageDto>> UpdatePackageAsync(
        Guid packageId,
        UpdateCourseOfferingPackageRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _uow.Repository<CourseOfferingPackage>().GetQueryable()
            .FirstOrDefaultAsync(p => p.Id == packageId && p.OrganizationId == orgId);
        if (entity == null)
            return FailPackage(ErrorCodes.NotFound, "Package not found.");

        var programError = await ValidateProgramGroupIdsAsync(orgId, request.ProgramGroupIds ?? new List<Guid>());
        if (programError != null)
            return FailPackage(programError.Code, programError.Message);

        entity.Name = request.Name.Trim();
        entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        _uow.Repository<CourseOfferingPackage>().Update(entity);

        await SyncPackageProgramsAsync(orgId, packageId, request.ProgramGroupIds ?? new List<Guid>());
        await _uow.CompleteAsync();

        return new ServiceResponse<CourseOfferingPackageDto>(true, await MapPackageAsync(packageId));
    }

    public async Task<ServiceResponse<bool>> DeletePackageAsync(Guid packageId)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _uow.Repository<CourseOfferingPackage>().GetQueryable()
            .FirstOrDefaultAsync(p => p.Id == packageId && p.OrganizationId == orgId);
        if (entity == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Package not found."));

        _uow.Repository<CourseOfferingPackage>().Remove(entity);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<CourseOfferingPackageDto>> SavePackageItemsAsync(
        Guid packageId,
        SaveCourseOfferingPackageItemsRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var package = await _context.CourseOfferingPackages
            .FirstOrDefaultAsync(p => p.Id == packageId && p.OrganizationId == orgId);
        if (package == null)
            return FailPackage(ErrorCodes.NotFound, "Package not found.");

        var existingItems = await _context.CourseOfferingPackageItems
            .Where(i => i.PackageId == packageId)
            .ToListAsync();
        _context.CourseOfferingPackageItems.RemoveRange(existingItems);

        var sort = 0;
        foreach (var item in request.Items.OrderBy(i => i.SortOrder).ThenBy(i => i.Name))
        {
            var programError = await ValidateProgramGroupIdsAsync(orgId, item.ProgramGroupIds ?? new List<Guid>());
            if (programError != null)
                return FailPackage(programError.Code, programError.Message);

            var instructorInputs = ResolveItemInstructors(item.DefaultHostId, null, item.Instructors);
            var primaryHostId = instructorInputs
                .FirstOrDefault(i => OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary)?.UserId
                ?? item.DefaultHostId;

            var row = new CourseOfferingPackageItem
            {
                OrganizationId = orgId,
                PackageId = packageId,
                Name = item.Name.Trim(),
                Code = string.IsNullOrWhiteSpace(item.Code) ? null : item.Code.Trim(),
                Description = item.Description,
                SortOrder = item.SortOrder > 0 ? item.SortOrder : sort++,
                DefaultHostId = primaryHostId,
                InstructorsJson = SerializeInstructors(instructorInputs),
                WeeklySessionPlanJson = OfferingSessionPlanJson.Serialize(item.WeeklySessions)
            };
            await _context.CourseOfferingPackageItems.AddAsync(row);
            await _uow.CompleteAsync();

            await SyncPackageItemProgramsAsync(orgId, row.Id, item.ProgramGroupIds ?? new List<Guid>());
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<CourseOfferingPackageDto>(true, await MapPackageAsync(packageId));
    }

    public async Task<ServiceResponse<ApplyOfferingPackageResultDto>> ApplyPackageToPeriodAsync(
        Guid periodId,
        Guid packageId,
        ApplyOfferingPackageRequest request)
    {
        var orgId = _userContext.OrganizationId;
        if (!await _context.OrganizationPeriods.AnyAsync(p => p.Id == periodId && p.OrganizationId == orgId && !p.IsDeleted))
            return FailApply(ErrorCodes.NotFound, "Period not found.");

        var package = await _context.CourseOfferingPackages.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == packageId && p.OrganizationId == orgId);
        if (package == null)
            return FailApply(ErrorCodes.NotFound, "Package not found.");

        var packageProgramIds = await _context.CourseOfferingPackagePrograms.AsNoTracking()
            .Where(p => p.PackageId == packageId && !p.IsDeleted)
            .Select(p => p.ProgramGroupId)
            .ToListAsync();

        var items = await _context.CourseOfferingPackageItems.AsNoTracking()
            .Where(i => i.PackageId == packageId && !i.IsDeleted)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Name)
            .ToListAsync();

        if (items.Count == 0)
            return FailApply(ErrorCodes.InvalidInput, "Package has no courses. Add items first.");

        var itemsWithPrograms = 0;
        foreach (var item in items)
        {
            var itemProgramIds = await _context.CourseOfferingPackageItemPrograms.AsNoTracking()
                .Where(p => p.PackageItemId == item.Id && !p.IsDeleted)
                .Select(p => p.ProgramGroupId)
                .ToListAsync();
            if (itemProgramIds.Count > 0 || packageProgramIds.Count > 0)
                itemsWithPrograms++;
        }

        if (itemsWithPrograms == 0)
            return FailApply(
                ErrorCodes.InvalidInput,
                "Link at least one program on the package (or per course) before applying.");

        var offeringsCreated = 0;
        var offeringsSkipped = 0;
        var enrollmentsCreated = 0;
        var offeringsExistingEnrolled = 0;

        var limitNames = request.LimitToItemNames?
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var item in items)
        {
            if (limitNames is { Count: > 0 } && !limitNames.Contains(item.Name))
                continue;

            var itemProgramIds = await _context.CourseOfferingPackageItemPrograms.AsNoTracking()
                .Where(p => p.PackageItemId == item.Id && !p.IsDeleted)
                .Select(p => p.ProgramGroupId)
                .ToListAsync();

            var programIds = itemProgramIds.Count > 0 ? itemProgramIds : packageProgramIds;
            if (programIds.Count == 0)
            {
                offeringsSkipped++;
                continue;
            }

            if (request.SkipExistingNames)
            {
                var existingId = await FindMatchingOfferingIdAsync(orgId, periodId, item.Name, programIds);

                if (existingId.HasValue)
                {
                    offeringsSkipped++;
                    if (request.EnrollLinkedPrograms && request.EnrollExistingOfferings)
                    {
                        var enrolled = await _offeringService.EnrollLinkedProgramsAsync(
                            periodId,
                            existingId.Value,
                            new EnrollLinkedProgramsRequest());
                        if (enrolled.IsSuccess && enrolled.Data > 0)
                        {
                            enrollmentsCreated += enrolled.Data;
                            offeringsExistingEnrolled++;
                        }
                    }

                    continue;
                }
            }

            var instructorInputs = ResolveItemInstructors(item.DefaultHostId, item.InstructorsJson, null);
            var primaryHostId = instructorInputs
                .FirstOrDefault(i => OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary)?.UserId
                ?? item.DefaultHostId;

            var create = await _offeringService.CreateOfferingAsync(periodId, new CreateCourseOfferingRequest
            {
                Name = item.Name,
                Code = item.Code,
                Description = item.Description,
                ProgramGroupIds = programIds,
                HostId = primaryHostId,
                Instructors = instructorInputs.Count > 0 ? instructorInputs : null,
                WeeklySessions = OfferingSessionPlanJson.Parse(item.WeeklySessionPlanJson).ToList()
            });

            if (!create.IsSuccess || create.Data == null)
            {
                offeringsSkipped++;
                continue;
            }

            offeringsCreated++;

            if (request.EnrollLinkedPrograms)
            {
                var enrolled = await _offeringService.EnrollLinkedProgramsAsync(
                    periodId,
                    create.Data.Id,
                    new EnrollLinkedProgramsRequest());
                if (enrolled.IsSuccess)
                    enrollmentsCreated += enrolled.Data;
            }
        }

        return new ServiceResponse<ApplyOfferingPackageResultDto>(true, new ApplyOfferingPackageResultDto
        {
            OfferingsCreated = offeringsCreated,
            OfferingsSkipped = offeringsSkipped,
            EnrollmentsCreated = enrollmentsCreated,
            OfferingsExistingEnrolled = offeringsExistingEnrolled
        });
    }

    public async Task<ServiceResponse<RevertOfferingPackageResultDto>> RevertPackageFromPeriodAsync(
        Guid periodId,
        Guid packageId)
    {
        var orgId = _userContext.OrganizationId;
        if (!await _context.OrganizationPeriods.AnyAsync(p => p.Id == periodId && p.OrganizationId == orgId && !p.IsDeleted))
            return FailRevert(ErrorCodes.NotFound, "Period not found.");

        if (!await _context.CourseOfferingPackages.AnyAsync(p => p.Id == packageId && p.OrganizationId == orgId))
            return FailRevert(ErrorCodes.NotFound, "Package not found.");

        var itemNames = await _context.CourseOfferingPackageItems.AsNoTracking()
            .Where(i => i.PackageId == packageId && !i.IsDeleted)
            .Select(i => i.Name)
            .ToListAsync();

        if (itemNames.Count == 0)
            return FailRevert(ErrorCodes.InvalidInput, "Package has no courses.");

        var offerings = await _context.CourseOfferings
            .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId && !o.IsDeleted && itemNames.Contains(o.Name))
            .ToListAsync();

        var offeringsRemoved = 0;
        var enrollmentsRemoved = 0;

        foreach (var offering in offerings)
        {
            var enrollmentCount = await _context.OfferingEnrollments
                .CountAsync(e => e.OfferingId == offering.Id && !e.IsDeleted);
            enrollmentsRemoved += enrollmentCount;
            _uow.Repository<CourseOffering>().Remove(offering);
            offeringsRemoved++;
        }

        if (offeringsRemoved > 0)
            await _uow.CompleteAsync();

        return new ServiceResponse<RevertOfferingPackageResultDto>(true, new RevertOfferingPackageResultDto
        {
            OfferingsRemoved = offeringsRemoved,
            EnrollmentsRemoved = enrollmentsRemoved
        });
    }

    private async Task<CourseOfferingPackageDto> MapPackageAsync(Guid packageId)
    {
        var package = await _context.CourseOfferingPackages.AsNoTracking()
            .FirstAsync(p => p.Id == packageId);

        var programIds = await _context.CourseOfferingPackagePrograms.AsNoTracking()
            .Where(p => p.PackageId == packageId && !p.IsDeleted)
            .Select(p => p.ProgramGroupId)
            .ToListAsync();

        var programNames = programIds.Count == 0
            ? new List<string>()
            : await _context.Groups.AsNoTracking()
                .Where(g => programIds.Contains(g.Id))
                .OrderBy(g => g.Name)
                .Select(g => g.Name)
                .ToListAsync();

        var items = await _context.CourseOfferingPackageItems.AsNoTracking()
            .Where(i => i.PackageId == packageId && !i.IsDeleted)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Name)
            .ToListAsync();

        var itemDtos = new List<CourseOfferingPackageItemDto>();
        foreach (var item in items)
        {
            var itemProgramIds = await _context.CourseOfferingPackageItemPrograms.AsNoTracking()
                .Where(p => p.PackageItemId == item.Id && !p.IsDeleted)
                .Select(p => p.ProgramGroupId)
                .ToListAsync();

            var effectiveProgramIds = itemProgramIds.Count > 0 ? itemProgramIds : programIds;
            var effectiveProgramNames = effectiveProgramIds.Count == 0
                ? new List<string>()
                : await _context.Groups.AsNoTracking()
                    .Where(g => effectiveProgramIds.Contains(g.Id))
                    .OrderBy(g => g.Name)
                    .Select(g => g.Name)
                    .ToListAsync();

            string? hostName = null;
            if (item.DefaultHostId.HasValue)
            {
                hostName = await _context.Users.AsNoTracking()
                    .Where(u => u.Id == item.DefaultHostId.Value)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefaultAsync();
            }

            var instructorInputs = ResolveItemInstructors(item.DefaultHostId, item.InstructorsJson, null);
            var instructorUserIds = instructorInputs.Select(i => i.UserId).Distinct().ToList();
            var instructorNames = instructorUserIds.Count == 0
                ? new Dictionary<Guid, string>()
                : await _context.Users.AsNoTracking()
                    .Where(u => instructorUserIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.FirstName + " " + u.LastName);

            var instructorDtos = instructorInputs.Select(i => new OfferingInstructorDto
            {
                UserId = i.UserId,
                DisplayName = instructorNames.GetValueOrDefault(i.UserId, "Staff"),
                Role = OfferingInstructorRoles.Normalize(i.Role),
                IsPrimary = OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary
            }).ToList();

            itemDtos.Add(new CourseOfferingPackageItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Code = item.Code,
                Description = item.Description,
                SortOrder = item.SortOrder,
                DefaultHostId = item.DefaultHostId,
                DefaultHostName = hostName,
                Instructors = instructorDtos,
                ProgramGroupIds = effectiveProgramIds,
                ProgramGroupNames = effectiveProgramNames,
                WeeklySessions = OfferingSessionPlanJson.Parse(item.WeeklySessionPlanJson)
            });
        }

        return new CourseOfferingPackageDto
        {
            Id = package.Id,
            Name = package.Name,
            Description = package.Description,
            ProgramGroupIds = programIds,
            ProgramGroupNames = programNames,
            Items = itemDtos,
            CreatedAt = package.CreatedAt
        };
    }

    private async Task SyncPackageProgramsAsync(Guid orgId, Guid packageId, IReadOnlyList<Guid> programGroupIds)
    {
        var existing = await _context.CourseOfferingPackagePrograms.Where(p => p.PackageId == packageId).ToListAsync();
        _context.CourseOfferingPackagePrograms.RemoveRange(existing);

        foreach (var programId in programGroupIds.Where(id => id != Guid.Empty).Distinct())
        {
            await _context.CourseOfferingPackagePrograms.AddAsync(new CourseOfferingPackageProgram
            {
                OrganizationId = orgId,
                PackageId = packageId,
                ProgramGroupId = programId
            });
        }
    }

    private async Task SyncPackageItemProgramsAsync(Guid orgId, Guid itemId, IReadOnlyList<Guid> programGroupIds)
    {
        var existing = await _context.CourseOfferingPackageItemPrograms.Where(p => p.PackageItemId == itemId).ToListAsync();
        _context.CourseOfferingPackageItemPrograms.RemoveRange(existing);

        foreach (var programId in programGroupIds.Where(id => id != Guid.Empty).Distinct())
        {
            await _context.CourseOfferingPackageItemPrograms.AddAsync(new CourseOfferingPackageItemProgram
            {
                OrganizationId = orgId,
                PackageItemId = itemId,
                ProgramGroupId = programId
            });
        }
    }

    private async Task<AppError?> ValidateProgramGroupIdsAsync(Guid orgId, IReadOnlyList<Guid> programGroupIds)
    {
        foreach (var programId in programGroupIds.Where(id => id != Guid.Empty).Distinct())
        {
            var group = await _context.Groups.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == programId && g.OrganizationId == orgId && !g.IsDeleted);
            if (group == null)
                return new AppError(ErrorCodes.NotFound, "Program group not found.");
            if (GroupTypes.Normalize(group.Type) != GroupTypes.Program)
                return new AppError(ErrorCodes.InvalidInput, "Package programs must be program groups.");
        }

        return null;
    }

    private static ServiceResponse<CourseOfferingPackageDto> FailPackage(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static ServiceResponse<ApplyOfferingPackageResultDto> FailApply(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static ServiceResponse<RevertOfferingPackageResultDto> FailRevert(string code, string message) =>
        new(false, null, new AppError(code, message));

    private static List<OfferingInstructorInputDto> ResolveItemInstructors(
        Guid? defaultHostId,
        string? instructorsJson,
        List<OfferingInstructorInputDto>? requestInstructors)
    {
        if (requestInstructors?.Count > 0)
            return NormalizeInstructorInputs(requestInstructors, defaultHostId);

        if (!string.IsNullOrWhiteSpace(instructorsJson))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<OfferingInstructorInputDto>>(instructorsJson);
                if (parsed?.Count > 0)
                    return NormalizeInstructorInputs(parsed, defaultHostId);
            }
            catch (JsonException)
            {
                // ignore malformed legacy rows
            }
        }

        if (defaultHostId.HasValue)
        {
            return new List<OfferingInstructorInputDto>
            {
                new() { UserId = defaultHostId.Value, Role = OfferingInstructorRoles.Primary }
            };
        }

        return new List<OfferingInstructorInputDto>();
    }

    private static List<OfferingInstructorInputDto> NormalizeInstructorInputs(
        List<OfferingInstructorInputDto> inputs,
        Guid? fallbackHostId)
    {
        var list = inputs.Where(i => i.UserId != Guid.Empty).ToList();
        if (list.Count == 0 && fallbackHostId.HasValue)
        {
            list.Add(new OfferingInstructorInputDto
            {
                UserId = fallbackHostId.Value,
                Role = OfferingInstructorRoles.Primary
            });
        }

        if (list.Count == 0)
            return list;

        if (!list.Any(i => OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary))
            list[0].Role = OfferingInstructorRoles.Primary;

        return list;
    }

    private static string? SerializeInstructors(IReadOnlyList<OfferingInstructorInputDto> instructors) =>
        instructors.Count == 0 ? null : JsonSerializer.Serialize(instructors);

    /// <summary>
    /// Same course name may exist for different programs — match by name + program set, not name alone.
    /// </summary>
    private async Task<Guid?> FindMatchingOfferingIdAsync(
        Guid orgId,
        Guid periodId,
        string name,
        IReadOnlyList<Guid> programIds)
    {
        var normalizedPrograms = programIds.Where(id => id != Guid.Empty).Distinct().OrderBy(id => id).ToList();
        if (normalizedPrograms.Count == 0)
            return null;

        var candidateIds = await _context.CourseOfferings.AsNoTracking()
            .Where(o => o.OrganizationId == orgId && o.PeriodId == periodId && o.Name == name && !o.IsDeleted)
            .Select(o => o.Id)
            .ToListAsync();

        foreach (var candidateId in candidateIds)
        {
            var linkedPrograms = await _context.CourseOfferingPrograms.AsNoTracking()
                .Where(p => p.OfferingId == candidateId && !p.IsDeleted)
                .Select(p => p.ProgramGroupId)
                .ToListAsync();

            if (linkedPrograms.Count == 0)
            {
                var legacyProgramId = await _context.CourseOfferings.AsNoTracking()
                    .Where(o => o.Id == candidateId)
                    .Select(o => o.ProgramGroupId)
                    .FirstOrDefaultAsync();
                if (legacyProgramId.HasValue)
                    linkedPrograms = new List<Guid> { legacyProgramId.Value };
            }

            var candidateSet = linkedPrograms.Where(id => id != Guid.Empty).Distinct().OrderBy(id => id).ToList();
            if (candidateSet.SequenceEqual(normalizedPrograms))
                return candidateId;
        }

        return null;
    }
}
