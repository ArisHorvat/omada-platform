using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.DigitalId;

/// <summary>
/// Result of an authenticated staff scan of a member Digital ID QR token.
/// </summary>
public class DigitalIdScanResultDto
{
    [Required]
    public required bool Valid { get; set; }

    public Guid? UserId { get; set; }

    public Guid? OrganizationId { get; set; }

    public string? FullName { get; set; }

    public string? RoleName { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Message { get; set; }
}
