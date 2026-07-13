using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Users;

public class DirectoryGroupOptionDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? Type { get; set; }

    public int Depth { get; set; }

    public int MemberCount { get; set; }
}
