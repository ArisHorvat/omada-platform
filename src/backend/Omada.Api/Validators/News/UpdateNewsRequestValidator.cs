using FluentValidation;
using Omada.Api.DTOs.News;

namespace Omada.Api.Validators.News;

public class UpdateNewsRequestValidator : AbstractValidator<UpdateNewsRequest>
{
    public UpdateNewsRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(150).WithMessage("Title cannot exceed 150 characters.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(2000).WithMessage("Content cannot exceed 2000 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid news type.");

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Invalid news category.");
    }
}