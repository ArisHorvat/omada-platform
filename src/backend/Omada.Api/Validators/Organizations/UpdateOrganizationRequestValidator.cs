using FluentValidation;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Validators.Organizations;

public class UpdateOrganizationRequestValidator : AbstractValidator<UpdateOrganizationRequest>
{
    public UpdateOrganizationRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(3).WithMessage("Organization name must be at least 3 characters.");

        RuleFor(x => x.EmailDomain)
            .NotEmpty()
            .Matches(@"^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").WithMessage("Must be a valid email domain starting with @ (e.g., @omada.com).");

        // Validate hex color codes
        RuleFor(x => x.PrimaryColor).Matches(@"^#(?:[0-9a-fA-F]{3}){1,2}$").WithMessage("Primary color must be a valid Hex code.");
        RuleFor(x => x.SecondaryColor).Matches(@"^#(?:[0-9a-fA-F]{3}){1,2}$").WithMessage("Secondary color must be a valid Hex code.");
        RuleFor(x => x.TertiaryColor).Matches(@"^#(?:[0-9a-fA-F]{3}){1,2}$").WithMessage("Tertiary color must be a valid Hex code.");
    }
}