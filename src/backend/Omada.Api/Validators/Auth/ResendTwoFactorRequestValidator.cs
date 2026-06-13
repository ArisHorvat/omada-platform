using FluentValidation;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Validators.Auth;

public class ResendTwoFactorRequestValidator : AbstractValidator<ResendTwoFactorRequest>
{
    public ResendTwoFactorRequestValidator()
    {
        RuleFor(x => x.TwoFactorSessionToken).NotEmpty().WithMessage("Session token is required.");
    }
}
