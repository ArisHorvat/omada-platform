using FluentValidation;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Validators.Organizations;

public class RoleWidgetMappingDtoValidator : AbstractValidator<RoleWidgetMappingDto>
{
    public RoleWidgetMappingDtoValidator()
    {
        RuleFor(x => x.RoleName).NotEmpty().WithMessage("Role name is required for mapping.");
        RuleFor(x => x.WidgetKey).NotEmpty().WithMessage("Widget key is required for mapping.");
        
        RuleFor(x => x.AccessLevel)
            .Must(level => level.Equals("view", StringComparison.OrdinalIgnoreCase) || 
                           level.Equals("edit", StringComparison.OrdinalIgnoreCase) || 
                           level.Equals("admin", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Access level must be 'view', 'edit', or 'admin'.");
    }
}