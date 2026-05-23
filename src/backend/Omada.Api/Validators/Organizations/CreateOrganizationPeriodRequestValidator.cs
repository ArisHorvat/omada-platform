using FluentValidation;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Validators.Organizations;

public class CreateOrganizationPeriodRequestValidator : AbstractValidator<CreateOrganizationPeriodRequest>
{
    public CreateOrganizationPeriodRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be on or after the start date.");
    }
}

public class UpdateOrganizationPeriodRequestValidator : AbstractValidator<UpdateOrganizationPeriodRequest>
{
    public UpdateOrganizationPeriodRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be on or after the start date.");
    }
}
