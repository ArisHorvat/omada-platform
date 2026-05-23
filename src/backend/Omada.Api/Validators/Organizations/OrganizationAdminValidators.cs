using FluentValidation;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Validators.Organizations;

public class UpdateCurrentOrganizationRequestValidator : AbstractValidator<UpdateCurrentOrganizationRequest>
{
    public UpdateCurrentOrganizationRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ShortName).MaximumLength(32).When(x => x.ShortName != null);
        RuleFor(x => x.EmailDomain).MaximumLength(128).When(x => x.EmailDomain != null);
        RuleFor(x => x.PrimaryColor).NotEmpty().Matches("^#[0-9A-Fa-f]{6}$");
        RuleFor(x => x.SecondaryColor).NotEmpty().Matches("^#[0-9A-Fa-f]{6}$");
        RuleFor(x => x.TertiaryColor).NotEmpty().Matches("^#[0-9A-Fa-f]{6}$");
        RuleFor(x => x.OnboardingStep).InclusiveBetween(0, 20).When(x => x.OnboardingStep.HasValue);
    }
}

public class UpdateOrganizationEnabledWidgetsRequestValidator : AbstractValidator<UpdateOrganizationEnabledWidgetsRequest>
{
    public UpdateOrganizationEnabledWidgetsRequestValidator()
    {
        RuleFor(x => x.EnabledWidgetKeys).NotNull().NotEmpty();
        RuleForEach(x => x.EnabledWidgetKeys).NotEmpty().MaximumLength(64);
    }
}

public class InviteMembersRequestValidator : AbstractValidator<InviteMembersRequest>
{
    public InviteMembersRequestValidator()
    {
        RuleFor(x => x.Members).NotEmpty().WithMessage("At least one member is required.");
        RuleFor(x => x.Members.Count).LessThanOrEqualTo(100);
        RuleForEach(x => x.Members).SetValidator(new InviteMemberItemDtoValidator());
    }
}

public class InviteMemberItemDtoValidator : AbstractValidator<InviteMemberItemDto>
{
    public InviteMemberItemDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.RoleName).NotEmpty().MaximumLength(64);
    }
}

public class CreateOrganizationRoleRequestValidator : AbstractValidator<CreateOrganizationRoleRequest>
{
    public CreateOrganizationRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(64);
    }
}

public class UpdateOrganizationRoleRequestValidator : AbstractValidator<UpdateOrganizationRoleRequest>
{
    public UpdateOrganizationRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(64);
    }
}

public class UpdateRolePermissionsRequestValidator : AbstractValidator<UpdateRolePermissionsRequest>
{
    public UpdateRolePermissionsRequestValidator()
    {
        RuleFor(x => x.Permissions).NotNull();
        RuleForEach(x => x.Permissions).ChildRules(p =>
        {
            p.RuleFor(x => x.WidgetKey).NotEmpty().MaximumLength(64);
            p.RuleFor(x => x.AccessLevel).Must(l => l is "view" or "edit" or "admin")
                .WithMessage("Access level must be view, edit, or admin.");
        });
    }
}
