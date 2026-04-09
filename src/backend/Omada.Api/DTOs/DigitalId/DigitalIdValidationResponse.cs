using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.DigitalId;

public class DigitalIdValidationResponse
{
    [Required]
    public required bool Valid { get; set; }

    public Guid? UserId { get; set; }

    public Guid? OrganizationId { get; set; }

    public DateTime? IssuedAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }

    public string? Message { get; set; }
}
