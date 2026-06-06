using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Auth;

public class JoinWithCodeResultDto
{
    [Required]
    public required string OrganizationName { get; set; }

    /// <summary>PendingApproval | Joined</summary>
    [Required]
    public required string Status { get; set; }

    public LoginResponse? Session { get; set; }
}
