using FluentValidation;
using Omada.Api.DTOs.News;
using Omada.Api.Entities;
using Omada.Api.Validators;

namespace Omada.Api.Validators.News;

public class CreateNewsItemRequestValidator : AbstractValidator<CreateNewsItemRequest>
{
    public CreateNewsItemRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(150).WithMessage("Title cannot exceed 150 characters.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(20000).WithMessage("Content cannot exceed 20000 characters.");

        RuleFor(x => x.Type).IsInEnum().WithMessage("Invalid news type.");
        RuleFor(x => x.Category).IsInEnum().WithMessage("Invalid news category.");

        RuleFor(x => x.CoverImageUrl)
            .Must(AssetUrlValidation.IsValidHttpOrRootRelative)
            .WithMessage("CoverImageUrl must be a valid http(s) URL or a root-relative path (e.g. /news/images/...).");
    }
}
