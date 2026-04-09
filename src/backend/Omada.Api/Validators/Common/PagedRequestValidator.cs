using FluentValidation;
using Omada.Api.DTOs.Common;

namespace Omada.Api.Validators.Common;

public class PagedRequestValidator : AbstractValidator<PagedRequest>
{
    public PagedRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page size must be at least 1.")
            .LessThanOrEqualTo(100)
            .WithMessage("Page size cannot exceed 100 to prevent database performance issues.");
    }
}