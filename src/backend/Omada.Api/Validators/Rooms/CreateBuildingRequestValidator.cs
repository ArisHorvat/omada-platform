using FluentValidation;
using Omada.Api.DTOs.Rooms;

namespace Omada.Api.Validators.Rooms;

public class CreateBuildingRequestValidator : AbstractValidator<CreateBuildingRequest>
{
    public CreateBuildingRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Building name is required.")
            .MaximumLength(120).WithMessage("Building name cannot exceed 120 characters.");

        RuleFor(x => x.ShortCode)
            .MaximumLength(16)
            .When(x => x.ShortCode != null);

        RuleFor(x => x.Address)
            .MaximumLength(300)
            .When(x => x.Address != null);
    }
}

public class UpdateBuildingRequestValidator : AbstractValidator<UpdateBuildingRequest>
{
    public UpdateBuildingRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Building name is required.")
            .MaximumLength(120).WithMessage("Building name cannot exceed 120 characters.");

        RuleFor(x => x.ShortCode)
            .MaximumLength(16)
            .When(x => x.ShortCode != null);

        RuleFor(x => x.Address)
            .MaximumLength(300)
            .When(x => x.Address != null);
    }
}
