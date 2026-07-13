using FluentValidation;
using Omada.Api.DTOs.Announcements;

namespace Omada.Api.Validators.Announcements;

public class CreateAnnouncementPostRequestValidator : AbstractValidator<CreateAnnouncementPostRequest>
{
    public CreateAnnouncementPostRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(300);

        RuleFor(x => x.Content)
            .NotEmpty()
            .MaximumLength(8000);
    }
}
