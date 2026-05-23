using FluentValidation;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Validators.Scraping;

public class SpiderUrlRequestValidator : AbstractValidator<SpiderUrlRequest>
{
    public SpiderUrlRequestValidator()
    {
        RuleFor(x => x.Url)
            .Must(BeAbsoluteHttpUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.Url))
            .WithMessage("URL must be a valid absolute http or https address.");
    }

    private static bool BeAbsoluteHttpUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return true;
        return Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
