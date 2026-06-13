using FluentValidation;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Validators.Auth;

public class VerifyTwoFactorRequestValidator : AbstractValidator<VerifyTwoFactorRequest>
{
    public VerifyTwoFactorRequestValidator()
    {
        RuleFor(x => x.TwoFactorSessionToken).NotEmpty().WithMessage("Session token is required.");
        RuleFor(x => x.Code)
            .NotEmpty()
            .Length(6).WithMessage("Enter the 6-digit code from your email.")
            .Matches("^[0-9]{6}$").WithMessage("Enter the 6-digit code from your email.");
    }
}
