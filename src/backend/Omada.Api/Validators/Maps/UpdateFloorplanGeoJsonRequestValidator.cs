using FluentValidation;
using Omada.Api.DTOs.Maps;

namespace Omada.Api.Validators.Maps;

public class UpdateFloorplanGeoJsonRequestValidator : AbstractValidator<UpdateFloorplanGeoJsonRequest>
{
    public UpdateFloorplanGeoJsonRequestValidator()
    {
        RuleFor(x => x.GeoJsonData).NotEmpty().MinimumLength(2);
    }
}
