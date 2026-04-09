using FluentValidation;
using Omada.Api.DTOs.Users;
using Omada.Api.Infrastructure;

namespace Omada.Api.Validators.Users;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+?[1-9]\d{1,14}$").When(x => !string.IsNullOrEmpty(x.PhoneNumber))
            .WithMessage("Phone number must be a valid international format (e.g., +123456789).");

        RuleFor(x => x.AvatarUrl)
            .Must(RelativeWebPath.IsValidOptional)
            .When(x => !string.IsNullOrEmpty(x.AvatarUrl))
            .WithMessage("AvatarUrl must be a root-relative path (e.g. /images/avatars/…), not an absolute URL.");
    }
}