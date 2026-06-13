using FluentValidation;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Validators.Auth;

public class JoinOrganizationRequestValidator : AbstractValidator<JoinOrganizationRequest>
{
    public JoinOrganizationRequestValidator()
    {
        RuleFor(x => x.InviteCode).NotEmpty().MaximumLength(32);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).ApplyPasswordRules();
        RuleFor(x => x.SetupToken).MaximumLength(128);
    }
}
