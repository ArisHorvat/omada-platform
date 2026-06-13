using FluentValidation;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Validators.Offerings;

public class SaveOfferingGradePlanRequestValidator : AbstractValidator<SaveOfferingGradePlanRequest>
{
    public SaveOfferingGradePlanRequestValidator()
    {
        RuleFor(x => x.Categories).NotNull();
        RuleForEach(x => x.Categories).SetValidator(new UpsertOfferingGradeCategoryRequestValidator());
    }
}

public class UpsertOfferingGradeCategoryRequestValidator : AbstractValidator<UpsertOfferingGradeCategoryRequest>
{
    public UpsertOfferingGradeCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Weight).InclusiveBetween(0.0001m, 1m);
    }
}
