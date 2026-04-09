using FluentValidation;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;

namespace Omada.Api.Validators.Rooms;

public class RoomSearchRequestValidator : AbstractValidator<RoomSearchRequest>
{
    public RoomSearchRequestValidator()
    {
        // Pagination Rules
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0.")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100.");

        // Date Logic (Only validate if both are provided)
        RuleFor(x => x)
            .Must(x => x.AvailableTo > x.AvailableFrom)
            .When(x => x.AvailableFrom.HasValue && x.AvailableTo.HasValue)
            .WithMessage("End time must be after start time.");

        // Optional: Limit search term length to prevent abuse
        RuleFor(x => x.SearchTerm)
            .MaximumLength(50).WithMessage("Search term is too long.");

        RuleFor(x => x.BuildingIds)
            .Must(ids => ids == null || ids.Count <= 20)
            .WithMessage("Too many buildings selected.");

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