using FluentValidation;
using Omada.Api.DTOs.Groups;

namespace Omada.Api.Validators.Groups;

public class AddGroupMembersRequestValidator : AbstractValidator<AddGroupMembersRequest>
{
    public AddGroupMembersRequestValidator()
    {
        RuleFor(x => x.UserIds)
            .NotEmpty()
            .WithMessage("At least one user is required.");

        RuleForEach(x => x.UserIds)
            .NotEqual(Guid.Empty);

        RuleFor(x => x.RoleInGroup)
            .MaximumLength(64)
            .When(x => !string.IsNullOrWhiteSpace(x.RoleInGroup));
    }
}
