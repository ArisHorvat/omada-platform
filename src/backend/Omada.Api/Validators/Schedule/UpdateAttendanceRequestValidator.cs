using FluentValidation;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Schedule;

public class UpdateAttendanceRequestValidator : AbstractValidator<UpdateAttendanceRequest>
{
    public UpdateAttendanceRequestValidator()
    {
        RuleFor(x => x.InstanceDate)
            .NotEmpty().WithMessage("Instance date is required.")
            .Must(date => date != default(DateTime)).WithMessage("Invalid date format.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid attendance status.")
            .Must(status => status != AttendanceStatus.None)
            .WithMessage("Status cannot be None.");

        RuleFor(x => x)
            .Must(x => (!x.DeclineEventId.HasValue && !x.DeclineInstanceDate.HasValue)
                      || (x.DeclineEventId.HasValue && x.DeclineInstanceDate.HasValue))
            .WithMessage("DeclineEventId and DeclineInstanceDate must both be set or both omitted.");
    }
}