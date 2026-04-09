using FluentValidation;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Validators.Schedule;

public class ScheduleRequestDtoValidator : AbstractValidator<GetScheduleRequest>
{
    public ScheduleRequestDtoValidator()
    {
        RuleFor(x => x.FromDate).NotEmpty();
        
        RuleFor(x => x.ToDate)
            .NotEmpty()
            .GreaterThan(x => x.FromDate).WithMessage("End date must be after start date.");

        RuleFor(x => x)
            .Must(x => (x.ToDate - x.FromDate).TotalDays <= 366)
            .WithMessage("You cannot request more than 1 year of schedule data.");
        
        RuleFor(x => x)
            .Must(x => (x.ToDate - x.FromDate).TotalDays <= 365)
            .When(x => x.FromDate != default && x.ToDate != default)
            .WithMessage("You cannot query more than 1 year of schedule at a time.");
    }
}