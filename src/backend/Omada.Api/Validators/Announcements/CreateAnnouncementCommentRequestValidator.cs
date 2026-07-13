using FluentValidation;
using Omada.Api.DTOs.Announcements;

namespace Omada.Api.Validators.Announcements;

public class CreateAnnouncementCommentRequestValidator : AbstractValidator<CreateAnnouncementCommentRequest>
{
    public CreateAnnouncementCommentRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty()
            .MaximumLength(2000);
    }
}
