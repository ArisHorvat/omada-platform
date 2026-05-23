using FluentValidation;
using Omada.Api.DTOs.Groups;

namespace Omada.Api.Validators.Groups;

public class UpdateGroupRequestValidator : AbstractValidator<UpdateGroupRequest>
{
    public UpdateGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Type)
            .NotEmpty()
            .MaximumLength(64);

        RuleFor(x => x.ParentGroupId)
            .NotEqual(Guid.Empty)
            .When(x => x.ParentGroupId.HasValue);

        RuleFor(x => x.ManagerId)
            .NotEqual(Guid.Empty)
            .When(x => x.ManagerId.HasValue);
    }
}
