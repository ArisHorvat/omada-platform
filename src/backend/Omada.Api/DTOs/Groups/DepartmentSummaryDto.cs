using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

public class DepartmentSummaryDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }
}
