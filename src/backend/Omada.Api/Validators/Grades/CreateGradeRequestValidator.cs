using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Grades;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Grades;

public class CreateGradeRequestValidator : AbstractValidator<CreateGradeRequest>
{
    public CreateGradeRequestValidator(ApplicationDbContext db, IUserContext userContext)
    {
        RuleFor(x => x.CourseName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Semester)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Credits)
            .GreaterThan(0)
            .WithMessage("Credits must be greater than zero.");

        RuleFor(x => x.Score)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(10000);

        RuleFor(x => x.LetterGrade)
            .MaximumLength(8)
            .When(x => x.LetterGrade != null);

        RuleFor(x => x.UserId)
            .MustAsync(async (userId, ct) =>
            {
                var orgId = userContext.OrganizationId;
                return await db.Set<OrganizationMember>()
                    .AnyAsync(m => m.OrganizationId == orgId && m.UserId == userId && m.IsActive, ct);
            })
            .WithMessage("Student must be an active member of the organization.");

        RuleFor(x => x)
            .CustomAsync(async (_, ctx, ct) =>
            {
                var orgId = userContext.OrganizationId;
                var org = await db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orgId, ct);
                if (org == null)
                {
                    ctx.AddFailure("Organization", "Organization not found.");
                    return;
                }

                if (org.OrganizationType != OrganizationType.University)
                    ctx.AddFailure("Grades", "Grades are only applicable for university organizations.");
            });
    }
}
