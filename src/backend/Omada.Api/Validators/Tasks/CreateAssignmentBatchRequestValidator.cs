using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Tasks;

public class CreateAssignmentBatchRequestValidator : AbstractValidator<CreateAssignmentBatchRequest>
{
    public CreateAssignmentBatchRequestValidator(ApplicationDbContext db, IUserContext userContext)
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Assignment title cannot be empty.")
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(4000).When(x => x.Description != null);

        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date).When(x => x.DueDate.HasValue)
            .WithMessage("Due date must be today or in the future.");

        RuleFor(x => x.ReferenceUrl)
            .MaximumLength(2048).When(x => x.ReferenceUrl != null);

        RuleFor(x => x.MaxScore)
            .GreaterThan(0).When(x => x.MaxScore.HasValue);

        RuleFor(x => x.Weight)
            .InclusiveBetween(0.0001m, 1m).When(x => x.Weight.HasValue);

        RuleFor(x => x.DistributionScope)
            .Must(scope => scope is TaskDistributionScope.OfferingEnrolled or TaskDistributionScope.GroupMembers)
            .WithMessage("Distribution scope must be offering or group.");

        When(x => x.DistributionScope == TaskDistributionScope.OfferingEnrolled, () =>
        {
            RuleFor(x => x.OfferingId)
                .NotNull().WithMessage("Select a course offering to assign to all enrolled students.");
        });

        When(x => x.DistributionScope == TaskDistributionScope.GroupMembers, () =>
        {
            RuleFor(x => x.SubjectId)
                .NotNull().WithMessage("Select a group (class, lab, cohort) to assign to its members.");
        });

        RuleFor(x => x)
            .CustomAsync(async (req, ctx, ct) =>
            {
                var orgId = userContext.OrganizationId;

                if (req.DistributionScope == TaskDistributionScope.OfferingEnrolled && req.OfferingId.HasValue)
                {
                    var exists = await db.CourseOfferings.AnyAsync(
                        o => o.Id == req.OfferingId.Value && o.OrganizationId == orgId && !o.IsDeleted, ct);
                    if (!exists)
                        ctx.AddFailure(nameof(req.OfferingId), "Selected offering was not found.");
                }

                if (req.DistributionScope == TaskDistributionScope.GroupMembers && req.SubjectId.HasValue)
                {
                    var group = await db.Groups.AsNoTracking()
                        .FirstOrDefaultAsync(g => g.Id == req.SubjectId.Value && g.OrganizationId == orgId && !g.IsDeleted, ct);
                    if (group == null)
                        ctx.AddFailure(nameof(req.SubjectId), "Selected group was not found.");
                }
            });
    }
}
