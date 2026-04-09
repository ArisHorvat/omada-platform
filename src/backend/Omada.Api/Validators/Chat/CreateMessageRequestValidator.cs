using FluentValidation;
using Omada.Api.DTOs.Chat;

namespace Omada.Api.Validators.Chat;

public class CreateMessageRequestValidator : AbstractValidator<CreateMessageRequest>
{
    public CreateMessageRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Message content cannot be empty.")
            .MaximumLength(1000).WithMessage("Message is too long. Limit is 1000 characters.");
    }
}