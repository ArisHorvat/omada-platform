using FluentValidation;
using Omada.Api.DTOs.Rooms;

namespace Omada.Api.Validators.Rooms;

public class BookRoomRequestValidator : AbstractValidator<BookRoomRequest>
{
    public BookRoomRequestValidator()
    {
        RuleFor(x => x.StartUtc).NotEmpty();
        RuleFor(x => x.EndUtc)
            .NotEmpty()
            .GreaterThan(x => x.StartUtc).WithMessage("End time must be after start time.");
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}
