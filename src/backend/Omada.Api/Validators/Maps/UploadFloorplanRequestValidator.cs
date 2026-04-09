using FluentValidation;
using Omada.Api.DTOs.Maps;

namespace Omada.Api.Validators.Maps;

public class UploadFloorplanRequestValidator : AbstractValidator<UploadFloorplanRequest>
{
    public UploadFloorplanRequestValidator()
    {
        RuleFor(x => x.FloorId).NotEmpty();
        RuleFor(x => x.File).NotNull();
        RuleFor(x => x.File!.Length).GreaterThan(0).When(x => x.File != null);
        RuleFor(x => x.File!.ContentType)
            .Must(ct => ct != null && ct.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            .When(x => x.File != null && x.File.Length > 0)
            .WithMessage("Only image files are allowed for floorplans.");
    }
}
