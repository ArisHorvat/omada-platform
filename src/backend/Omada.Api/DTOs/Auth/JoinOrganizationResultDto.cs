using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Auth;

public class JoinOrganizationResultDto
{
    [Required]
    public required string OrganizationName { get; set; }

    [Required]
    public required string Email { get; set; }
}
