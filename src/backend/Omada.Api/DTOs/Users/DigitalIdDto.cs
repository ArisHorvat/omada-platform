using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Users;

/// <summary>
/// Card payload + short-lived signed QR string for the current user and organization.
/// </summary>
public class DigitalIdDto
{
    [Required]
    public required string FullName { get; set; }

    [Required]
    public required string RoleName { get; set; }

    [Required]
    public required string OrganizationName { get; set; }

    [Required]
    public required Guid OrganizationId { get; set; }

    public string? AvatarUrl { get; set; }

    /// <summary>When the QR JWT expires (UTC).</summary>
    [Required]
    public required DateTime QrExpiresAtUtc { get; set; }

    /// <summary>Signed JWT (HS256) encoding user id, org id, and time window — embed in QR.</summary>
    [Required]
    public required string QrToken { get; set; }

    /// <summary>Stable numeric-style value for 1D barcode (derived from user + org).</summary>
    [Required]
    public required string BarcodeValue { get; set; }
}
