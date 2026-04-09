using FluentValidation;
using Omada.Api.DTOs.Users;
using Omada.Api.Infrastructure;

namespace Omada.Api.Validators.Users;

public class UpdateMyProfileRequestValidator : AbstractValidator<UpdateMyProfileRequest>
{
    private static readonly HashSet<string> AllowedThemes =
        new(StringComparer.OrdinalIgnoreCase) { "light", "dark", "system" };

    public UpdateMyProfileRequestValidator()
    {
        RuleFor(x => x.ThemePreference)
            .Must(t => t == null || AllowedThemes.Contains(t))
            .WithMessage("ThemePreference must be light, dark, or system.");

        RuleFor(x => x.LanguagePreference)
            .MaximumLength(16)
            .Matches(@"^[a-z]{2}(-[A-Za-z0-9]+)?$")
            .When(x => !string.IsNullOrEmpty(x.LanguagePreference))
            .WithMessage("LanguagePreference must be a valid language tag (e.g. en, ro, en-US).");

        RuleFor(x => x.Bio)
            .MaximumLength(2000);

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+?[1-9]\d{1,14}$")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber))
            .WithMessage("Phone number must be a valid international format (e.g., +123456789).");

        RuleFor(x => x.AvatarUrl)
            .Must(RelativeWebPath.IsValidOptional)
            .When(x => !string.IsNullOrEmpty(x.AvatarUrl))
            .WithMessage("AvatarUrl must be a root-relative path (e.g. /images/avatars/…), not an absolute URL.");
    }
}
