using FluentValidation;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Validators.Schedule;

public class CreateEventTypeRequestValidator : AbstractValidator<CreateEventTypeRequest>
{
    public CreateEventTypeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(50).WithMessage("Name cannot exceed 50 characters.");

        RuleFor(x => x.ColorHex)
            .NotEmpty().WithMessage("Color is required.")
            .Matches("^#(?:[0-9a-fA-F]{3}){1,2}$")
            .WithMessage("Color must be a valid hex code (e.g. #FF0000).");
    }
}