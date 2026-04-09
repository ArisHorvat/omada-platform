using FluentValidation;
using Omada.Api.DTOs.DigitalId;

namespace Omada.Api.Validators.DigitalId;

public class ValidateDigitalIdRequestValidator : AbstractValidator<ValidateDigitalIdRequest>
{
    public ValidateDigitalIdRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty()
            .WithMessage("Token is required.");
    }
}
