using FluentValidation;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Rooms;

public class CreateRoomRequestValidator : AbstractValidator<CreateRoomRequest>
{
    public CreateRoomRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Room name is required.")
            .MaximumLength(100).WithMessage("Room name cannot exceed 100 characters.");

        RuleFor(x => x.Location)
            .MaximumLength(200).WithMessage("Location cannot exceed 200 characters.");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Capacity must be greater than 0.");

        // Optional: Ensure IDs are valid GUIDs if provided
        RuleForEach(x => x.AllowedEventTypeIds)
            .NotEqual(Guid.Empty).WithMessage("Invalid Event Type ID.");

        RuleFor(x => x.CustomAttributes)
            .MaximumLength(1_000_000)
            .When(x => x.CustomAttributes != null);

        RuleFor(x => x.BuildingId)
            .NotEqual(Guid.Empty)
            .When(x => x.BuildingId.HasValue);

        RuleFor(x => x.FloorId)
            .NotEqual(Guid.Empty)
            .When(x => x.FloorId.HasValue);

        RuleFor(x => x.RequiredRoleId)
            .NotEqual(Guid.Empty)
            .When(x => x.RequiredRoleId.HasValue);

        RuleFor(x => x.MapIconKey)
            .MaximumLength(64)
            .When(x => x.MapIconKey != null);

        RuleFor(x => x.Resources)
            .MaximumLength(2000)
            .When(x => x.Resources != null);

        RuleFor(x => x.AmenityKeys)
            .Must(keys => keys == null || keys.All(k =>
                string.IsNullOrWhiteSpace(k) || Enum.TryParse<RoomAmenity>(k.Trim(), ignoreCase: true, result: out _)))
            .When(x => x.AmenityKeys != null)
            .WithMessage("Unknown amenity key.");

        RuleFor(x => x.AmenityKeys)
            .Must(keys => keys == null || keys.Count <= 12)
            .WithMessage("Too many amenities selected.");
    }
}