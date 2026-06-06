using FluentValidation;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Validators.Auth;

public class JoinWithInviteCodeRequestValidator : AbstractValidator<JoinWithInviteCodeRequest>
{
    public JoinWithInviteCodeRequestValidator()
    {
        RuleFor(x => x.InviteCode).NotEmpty().MaximumLength(32);
    }
}
