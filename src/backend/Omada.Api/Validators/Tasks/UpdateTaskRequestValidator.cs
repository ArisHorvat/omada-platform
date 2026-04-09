using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Tasks;

public class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator(ApplicationDbContext db, IUserContext userContext)
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title cannot be empty.")
            .MaximumLength(200).WithMessage("Task title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(4000).When(x => x.Description != null);

        RuleFor(x => x.ReferenceUrl)
            .MaximumLength(2048).When(x => x.ReferenceUrl != null);

        RuleFor(x => x.SubmissionUrl)
            .MaximumLength(2048).When(x => x.SubmissionUrl != null);

        RuleFor(x => x.TeacherFeedback)
            .MaximumLength(4000).When(x => x.TeacherFeedback != null);

        RuleFor(x => x.MaxScore)
            .GreaterThan(0).When(x => x.MaxScore.HasValue);

        RuleFor(x => x.Weight)
            .InclusiveBetween(0.0001m, 1m).When(x => x.Weight.HasValue)
            .WithMessage("Weight must be between 0 and 1 (e.g. 0.20 for 20%).");

        When(x => x.AssigneeId.HasValue, () =>
        {
            RuleFor(x => x.AssigneeId!.Value)
                .MustAsync(async (assigneeId, ct) =>
                {
                    var orgId = userContext.OrganizationId;
                    return await db.Set<OrganizationMember>()
                        .AnyAsync(m => m.OrganizationId == orgId && m.UserId == assigneeId && m.IsActive, ct);
                })
                .WithMessage("Assignee must be an active member of the organization.");
        });

        RuleFor(x => x)
            .CustomAsync(async (req, ctx, ct) =>
            {
                var orgId = userContext.OrganizationId;
                var org = await db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orgId, ct);
                if (org == null)
                {
                    ctx.AddFailure("Organization", "Organization not found.");
                    return;
                }

                if (org.OrganizationType == OrganizationType.Corporate)
                {
                    if (req.SubjectId.HasValue || req.MaxScore.HasValue || req.Weight.HasValue)
                        ctx.AddFailure("University-specific fields (SubjectId, MaxScore, Weight) are not allowed for corporate organizations.");
                }
                else
                {
                    if (req.ProjectId.HasValue || req.Priority.HasValue)
                        ctx.AddFailure("Corporate-specific fields (ProjectId, Priority) are not allowed for university organizations.");
                }
            });
    }
}
