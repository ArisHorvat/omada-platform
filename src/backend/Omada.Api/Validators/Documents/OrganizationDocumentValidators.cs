using FluentValidation;
using Omada.Api.DTOs.Documents;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Validators.Documents;

public class UpdateOrganizationDocumentRequestValidator : AbstractValidator<UpdateOrganizationDocumentRequest>
{
    public UpdateOrganizationDocumentRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Category)
            .Must(DocumentCategories.IsValid)
            .WithMessage("Category is not valid.");

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .When(x => x.Description != null);
    }
}

public class OrganizationDocumentListRequestValidator : AbstractValidator<OrganizationDocumentListRequest>
{
    public OrganizationDocumentListRequestValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);

        RuleFor(x => x.Category)
            .Must(c => c == null || DocumentCategories.IsValid(c))
            .WithMessage("Category is not valid.");

        RuleFor(x => x.Q)
            .MaximumLength(200)
            .When(x => x.Q != null);
    }
}
