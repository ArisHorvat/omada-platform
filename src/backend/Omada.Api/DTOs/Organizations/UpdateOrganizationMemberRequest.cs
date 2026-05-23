namespace Omada.Api.DTOs.Organizations;

public class UpdateOrganizationMemberRequest
{
    public Guid? RoleId { get; set; }

    public bool? IsActive { get; set; }
}
