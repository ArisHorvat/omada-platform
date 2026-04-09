using FluentValidation;
using Omada.Api.DTOs.Users;

namespace Omada.Api.Validators.Users;

public class UpdateSecurityRequestValidator : AbstractValidator<UpdateSecurityRequest>
{
    public UpdateSecurityRequestValidator()
    {
        // For a simple boolean, validation isn't strictly necessary since ASP.NET 
        // will automatically reject non-boolean values, but you can add custom rules here if needed later.
        RuleFor(x => x.IsTwoFactorEnabled).NotNull();
    }
}