using FluentValidation;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Validators.Import;

namespace Omada.Api.Validators.Organizations;

public class RegisterOrganizationValidator : AbstractValidator<RegisterOrganizationRequest>
{
    public RegisterOrganizationValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MinimumLength(3).WithMessage("Organization name must be at least 3 characters.");
        RuleFor(x => x.EmailDomain).NotEmpty().Matches(@"^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").WithMessage("Must be a valid email domain starting with @ (e.g., @omada.com).");
        
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress().WithMessage("A valid admin email is required.");
        RuleFor(x => x.AdminFirstName).NotEmpty();
        RuleFor(x => x.AdminLastName).NotEmpty();
        
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
        
        RuleForEach(x => x.Users).SetValidator(new UserImportDtoValidator());
        RuleForEach(x => x.RoleWidgetMappings).SetValidator(new RoleWidgetMappingDtoValidator());
    }
}