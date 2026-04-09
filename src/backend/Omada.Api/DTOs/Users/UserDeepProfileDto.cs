using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Users;

public class UserDeepProfileDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string FirstName { get; set; }

    [Required]
    public required string LastName { get; set; }

    [Required]
    public required string RoleName { get; set; }

    public string? Title { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? ManagerId { get; set; }

    public string? Email { get; set; }
    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Address { get; set; }
    public string? Bio { get; set; }

    public bool IsPublicInDirectory { get; set; }
}

