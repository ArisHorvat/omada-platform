using FluentValidation;
using Omada.Api.DTOs.Schedule;

namespace Omada.Api.Validators.Schedule;

public class CreateEventRequestValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(150);

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required.")
            .GreaterThan(x => x.StartTime).WithMessage("End time must be after start time.");

        // 🚀 Validate GUIDs for Dynamic Types
        RuleFor(x => x.EventTypeId)
            .NotEmpty().WithMessage("Event Type is required.")
            .NotEqual(Guid.Empty).WithMessage("Invalid Event Type ID.");

        // Optional Relationships
        RuleFor(x => x.RoomId)
            .NotEqual(Guid.Empty).When(x => x.RoomId.HasValue);

        RuleFor(x => x.HostId)
            .NotEqual(Guid.Empty).When(x => x.HostId.HasValue);

        RuleFor(x => x.GroupId)
            .NotEqual(Guid.Empty).When(x => x.GroupId.HasValue);

        RuleFor(x => x.ColorHex)
            .Matches("^#(?:[0-9a-fA-F]{3}){1,2}$").When(x => !string.IsNullOrEmpty(x.ColorHex))
            .WithMessage("Color must be a valid hex code (e.g. #FF0000).");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).When(x => x.MaxCapacity.HasValue)
            .WithMessage("Max capacity must be greater than zero when set.");
    }
}