using FluentValidation;
using Omada.Api.DTOs.Groups;

namespace Omada.Api.Validators.Groups;

public class MoveGroupMembersRequestValidator : AbstractValidator<MoveGroupMembersRequest>
{
    public MoveGroupMembersRequestValidator()
    {
        RuleFor(x => x.SourceGroupId).NotEqual(Guid.Empty);
        RuleFor(x => x.TargetGroupId).NotEqual(Guid.Empty);
        RuleFor(x => x)
            .Must(x => x.SourceGroupId != x.TargetGroupId)
            .WithMessage("Source and target groups must differ.");

        RuleFor(x => x.UserIds)
            .NotEmpty()
            .WithMessage("At least one user is required.");

        RuleForEach(x => x.UserIds)
            .NotEqual(Guid.Empty);
    }
}
