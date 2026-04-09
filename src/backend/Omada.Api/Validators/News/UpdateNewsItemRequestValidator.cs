using FluentValidation;
using Omada.Api.DTOs.News;
using Omada.Api.Validators;

namespace Omada.Api.Validators.News;

public class UpdateNewsItemRequestValidator : AbstractValidator<UpdateNewsItemRequest>
{
    public UpdateNewsItemRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(150).WithMessage("Title cannot exceed 150 characters.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(5000).WithMessage("Content cannot exceed 5000 characters.");

        RuleFor(x => x.CoverImageUrl)
            .Must(AssetUrlValidation.IsValidHttpOrRootRelative)
            .WithMessage("CoverImageUrl must be a valid http(s) URL or a root-relative path (e.g. /news/images/...).");
    }
}
