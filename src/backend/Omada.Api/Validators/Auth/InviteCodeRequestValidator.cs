using FluentValidation;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Validators.Auth;

public class InviteCodeRequestValidator : AbstractValidator<InviteCodeRequest>
{
    public InviteCodeRequestValidator()
    {
        RuleFor(x => x.InviteCode).NotEmpty().MaximumLength(32);
    }
}
