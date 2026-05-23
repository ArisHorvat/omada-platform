using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class AuditLogDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid OrganizationId { get; set; }

    public string? OrganizationName { get; set; }

    [Required]
    public required Guid ActorUserId { get; set; }

    public string? ActorName { get; set; }

    [Required]
    public required string Action { get; set; }

    public string? EntityType { get; set; }

    public Guid? EntityId { get; set; }

    [Required]
    public required string Summary { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }
}
