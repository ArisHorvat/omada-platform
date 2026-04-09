using FluentValidation;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Validators.Auth;

public class SwitchOrgRequestValidator : AbstractValidator<SwitchOrgRequest>
{
    public SwitchOrgRequestValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization ID is required.");
    }
}