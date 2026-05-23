using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Grades;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Grading;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class GradeService : IGradeService
{
    private readonly IGradeRepository _gradeRepository;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;

    public GradeService(IGradeRepository gradeRepository, IUnitOfWork uow, IUserContext userContext)
    {
        _gradeRepository = gradeRepository;
        _uow = uow;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<MyGradesResponse>> GetMyGradesAsync(
        Guid? groupId = null,
        CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var rows = await _gradeRepository.GetForUserAsync(organizationId, userId, groupId, cancellationToken);

        var gpa = GradePointCalculator.CalculateWeightedGpa(rows);
        var totalCredits = rows.Where(g => g.Credits > 0).Sum(g => g.Credits);

        var dtos = rows.Select(MapGrade).ToList();

        return new ServiceResponse<MyGradesResponse>(true, new MyGradesResponse
        {
            Grades = dtos,
            CurrentGpa = gpa,
            TotalCredits = totalCredits
        });
    }

    public async Task<ServiceResponse<PagedResponse<GradeAdminDto>>> GetAdminGradesAsync(
        PagedRequest request,
        Guid? userId,
        string? semester,
        Guid? groupId,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var paged = await _gradeRepository.GetPagedForOrganizationAsync(
            orgId,
            request.Page,
            request.PageSize,
            userId,
            semester,
            groupId,
            cancellationToken);

        return new ServiceResponse<PagedResponse<GradeAdminDto>>(true, new PagedResponse<GradeAdminDto>
        {
            Items = paged.Items.Select(MapAdminGrade).ToList(),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        });
    }

    public async Task<ServiceResponse<GradeAdminDto>> CreateGradeAsync(
        CreateGradeRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var entity = new Grade
        {
            OrganizationId = orgId,
            UserId = request.UserId,
            GroupId = request.GroupId,
            CourseName = request.CourseName.Trim(),
            Score = request.Score,
            Credits = request.Credits,
            LetterGrade = string.IsNullOrWhiteSpace(request.LetterGrade) ? null : request.LetterGrade.Trim(),
            Semester = request.Semester.Trim()
        };

        await _gradeRepository.AddAsync(entity);
        await _uow.CompleteAsync();

        var loaded = (await _gradeRepository.GetPagedForOrganizationAsync(
            orgId, 1, 1, entity.UserId, entity.Semester, entity.GroupId, cancellationToken))
            .Items.FirstOrDefault(g => g.Id == entity.Id);

        return new ServiceResponse<GradeAdminDto>(true, MapAdminGrade(loaded ?? entity));
    }

    public async Task<ServiceResponse<GradeAdminDto>> UpdateGradeAsync(
        Guid id,
        UpdateGradeRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _gradeRepository.GetByIdAsync(id);
        if (entity == null || entity.OrganizationId != orgId)
            return new ServiceResponse<GradeAdminDto>(false, null, new AppError(ErrorCodes.NotFound, "Grade not found."));

        entity.CourseName = request.CourseName.Trim();
        entity.Score = request.Score;
        entity.Credits = request.Credits;
        entity.LetterGrade = string.IsNullOrWhiteSpace(request.LetterGrade) ? null : request.LetterGrade.Trim();
        entity.Semester = request.Semester.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        _gradeRepository.Update(entity);
        await _uow.CompleteAsync();

        var loaded = (await _gradeRepository.GetPagedForOrganizationAsync(
            orgId, 1, 1, entity.UserId, null, null, cancellationToken))
            .Items.FirstOrDefault(g => g.Id == entity.Id);

        return new ServiceResponse<GradeAdminDto>(true, MapAdminGrade(loaded ?? entity));
    }

    public async Task<ServiceResponse<bool>> DeleteGradeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _gradeRepository.GetByIdAsync(id);
        if (entity == null || entity.OrganizationId != orgId)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Grade not found."));

        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        _gradeRepository.Update(entity);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    private static GradeDto MapGrade(Grade g)
    {
        var points = GradePointCalculator.GetGradePoints(g);
        return new GradeDto
        {
            Id = g.Id,
            GroupId = g.GroupId,
            GroupName = g.Group?.Name,
            CourseName = g.CourseName,
            Score = g.Score,
            Credits = g.Credits,
            LetterGrade = g.LetterGrade,
            Semester = g.Semester,
            GradePoints = points,
            CreatedAt = g.CreatedAt
        };
    }

    private static GradeAdminDto MapAdminGrade(Grade g)
    {
        var dto = MapGrade(g);
        return new GradeAdminDto
        {
            Id = dto.Id,
            UserId = g.UserId,
            StudentName = g.User == null
                ? null
                : $"{g.User.FirstName} {g.User.LastName}".Trim(),
            GroupId = dto.GroupId,
            GroupName = dto.GroupName,
            CourseName = dto.CourseName,
            Score = dto.Score,
            Credits = dto.Credits,
            LetterGrade = dto.LetterGrade,
            Semester = dto.Semester,
            GradePoints = dto.GradePoints,
            CreatedAt = dto.CreatedAt
        };
    }
}
