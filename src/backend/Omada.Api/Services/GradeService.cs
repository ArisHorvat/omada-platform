using Omada.Api.Abstractions;
using Omada.Api.DTOs.Grades;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Grading;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class GradeService : IGradeService
{
    private readonly IGradeRepository _gradeRepository;
    private readonly IUserContext _userContext;

    public GradeService(IGradeRepository gradeRepository, IUserContext userContext)
    {
        _gradeRepository = gradeRepository;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<MyGradesResponse>> GetMyGradesAsync(CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var rows = await _gradeRepository.GetForUserAsync(organizationId, userId, cancellationToken);

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

    private static GradeDto MapGrade(Grade g)
    {
        var points = GradePointCalculator.GetGradePoints(g);
        return new GradeDto
        {
            Id = g.Id,
            CourseName = g.CourseName,
            Score = g.Score,
            Credits = g.Credits,
            LetterGrade = g.LetterGrade,
            Semester = g.Semester,
            GradePoints = points,
            CreatedAt = g.CreatedAt
        };
    }
}
