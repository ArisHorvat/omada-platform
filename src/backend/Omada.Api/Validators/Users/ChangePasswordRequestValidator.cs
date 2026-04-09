using FluentValidation;
using Omada.Api.DTOs.Users;

namespace Omada.Api.Validators.Users;

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.OldPassword).NotEmpty().WithMessage("Current password is required.");
        
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8).WithMessage("New password must be at least 8 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .NotEqual(x => x.OldPassword).WithMessage("New password must be different from the old password.");
    }
}