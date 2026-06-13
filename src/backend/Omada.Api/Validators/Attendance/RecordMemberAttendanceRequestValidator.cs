using FluentValidation;
using Omada.Api.DTOs.Attendance;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Attendance;

public class RecordMemberAttendanceRequestValidator : AbstractValidator<RecordMemberAttendanceRequest>
{
    public RecordMemberAttendanceRequestValidator()
    {
        RuleFor(x => x.EventId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.InstanceDate).NotEmpty();
        RuleFor(x => x.Status)
            .Must(s => s != AttendanceStatus.None)
            .WithMessage("Attendance status cannot be None.");
    }
}
