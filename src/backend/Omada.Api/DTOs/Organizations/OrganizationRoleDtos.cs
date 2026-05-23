using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class OrganizationRoleDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required int MemberCount { get; set; }

    [Required]
    public required int PermissionCount { get; set; }
}

public class WidgetPermissionDto
{
    [Required]
    public required string WidgetKey { get; set; }

    [Required]
    public required string AccessLevel { get; set; }
}

public class OrganizationRoleDetailDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required List<WidgetPermissionDto> Permissions { get; set; }
}

public class CreateOrganizationRoleRequest
{
    [Required]
    public required string Name { get; set; }
}

public class UpdateOrganizationRoleRequest
{
    [Required]
    public required string Name { get; set; }
}

public class UpdateRolePermissionsRequest
{
    [Required]
    public required List<WidgetPermissionDto> Permissions { get; set; }
}

public class WidgetCatalogItemDto
{
    [Required]
    public required string Key { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required string Icon { get; set; }

    [Required]
    public required string DefaultAccessLevel { get; set; }

    [Required]
    public required bool IsCoreFeature { get; set; }

    [Required]
    public required bool IsEnabledForOrganization { get; set; }
}

public class RegenerateInviteCodeResponse
{
    [Required]
    public required string InviteCode { get; set; }

    [Required]
    public required string InviteLink { get; set; }
}
