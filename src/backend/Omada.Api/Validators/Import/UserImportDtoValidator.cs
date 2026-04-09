using FluentValidation;
using Omada.Api.DTOs.Import;

namespace Omada.Api.Validators.Import;

public class UserImportDtoValidator : AbstractValidator<UserImportDto>
{
    public UserImportDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required for imported users.");
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required for imported users.");
        
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required for imported users.")
            .EmailAddress().WithMessage("Imported user must have a valid email format.");

        RuleFor(x => x.Role).NotEmpty().WithMessage("Imported user must be assigned a role.");
    }
}