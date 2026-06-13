using FluentValidation;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Validators.Offerings;

public class CreateCourseOfferingRequestValidator : AbstractValidator<CreateCourseOfferingRequest>
{
    public CreateCourseOfferingRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).MaximumLength(40).When(x => x.Code != null);
        RuleFor(x => x.Description).MaximumLength(2000).When(x => x.Description != null);
        RuleFor(x => x.Credits).GreaterThanOrEqualTo(0).LessThanOrEqualTo(999);
        RuleFor(x => x.RequiredAttendancePercent)
            .InclusiveBetween(0, 100)
            .When(x => x.RequiredAttendancePercent.HasValue);
    }
}

public class UpdateCourseOfferingRequestValidator : AbstractValidator<UpdateCourseOfferingRequest>
{
    public UpdateCourseOfferingRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).MaximumLength(40).When(x => x.Code != null);
        RuleFor(x => x.Description).MaximumLength(2000).When(x => x.Description != null);
        RuleFor(x => x.Credits).GreaterThanOrEqualTo(0).LessThanOrEqualTo(999);
        RuleFor(x => x.RequiredAttendancePercent)
            .InclusiveBetween(0, 100)
            .When(x => x.RequiredAttendancePercent.HasValue);
    }
}

public class EnrollCohortRequestValidator : AbstractValidator<EnrollCohortRequest>
{
    public EnrollCohortRequestValidator()
    {
        RuleFor(x => x.CohortGroupId).NotEmpty();
    }
}

public class EnrollProgramCohortsRequestValidator : AbstractValidator<EnrollProgramCohortsRequest>
{
    public EnrollProgramCohortsRequestValidator()
    {
        RuleFor(x => x.ProgramGroupId).NotEmpty();
    }
}

public class RolloverOfferingsRequestValidator : AbstractValidator<RolloverOfferingsRequest>
{
    public RolloverOfferingsRequestValidator()
    {
        RuleFor(x => x.SourcePeriodId).NotEmpty();
    }
}

public class SetupProgramTermRequestValidator : AbstractValidator<SetupProgramTermRequest>
{
    public SetupProgramTermRequestValidator()
    {
        RuleFor(x => x.ProgramGroupId).NotEmpty();
        RuleForEach(x => x.OfferingNames!).MaximumLength(200).When(x => x.OfferingNames != null);
    }
}
