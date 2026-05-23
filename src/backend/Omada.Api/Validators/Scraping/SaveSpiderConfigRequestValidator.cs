using FluentValidation;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Validators.Scraping;

public class SaveSpiderConfigRequestValidator : AbstractValidator<SaveSpiderConfigRequest>
{
    public SaveSpiderConfigRequestValidator()
    {
        RuleFor(x => x.SchedulePageUrl)
            .Must(BeAbsoluteHttpUrlOrEmpty)
            .WithMessage("Schedule URL must be a valid absolute http or https address.");

        RuleFor(x => x.NewsStartUrl)
            .Must(BeAbsoluteHttpUrlOrEmpty)
            .WithMessage("News URL must be a valid absolute http or https address.");
    }

    private static bool BeAbsoluteHttpUrlOrEmpty(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return true;
        return Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
