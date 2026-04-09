using FluentValidation;
using Omada.Api.DTOs.Groups;

namespace Omada.Api.Validators.Groups;

public class CreateGroupRequestValidator : AbstractValidator<CreateGroupRequest>
{
    public CreateGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Group name is required.")
            .MinimumLength(2).WithMessage("Group name must be at least 2 characters.");
    }
}