using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class OrganizationPeriodDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required DateTime StartDate { get; set; }

    [Required]
    public required DateTime EndDate { get; set; }

    [Required]
    public required bool IsCurrent { get; set; }
}
