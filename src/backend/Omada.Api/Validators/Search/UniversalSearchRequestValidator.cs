using FluentValidation;
using Omada.Api.DTOs.Search;

namespace Omada.Api.Validators.Search;

public class UniversalSearchRequestValidator : AbstractValidator<UniversalSearchRequest>
{
    public UniversalSearchRequestValidator()
    {
        RuleFor(x => x.Q)
            .NotEmpty().WithMessage("Search query is required.")
            .MinimumLength(2).WithMessage("Search query must be at least 2 characters.")
            .MaximumLength(100).WithMessage("Search query is too long.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0.")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100.");

        RuleFor(x => x.LimitPerType)
            .InclusiveBetween(1, 20).WithMessage("Limit per type must be between 1 and 20.");

        RuleFor(x => x.Types)
            .Must(types => types == null || types.All(t => SearchTypes.All.Contains(t, StringComparer.OrdinalIgnoreCase)))
            .When(x => x.Types != null && x.Types.Count > 0)
            .WithMessage("Unknown search type.");
    }
}
