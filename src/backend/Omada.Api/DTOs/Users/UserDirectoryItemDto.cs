using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Users;

public class UserDirectoryItemDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string FirstName { get; set; }

    [Required]
    public required string LastName { get; set; }

    public string? Title { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? ManagerId { get; set; }

    /// <summary>User role within the current organization (e.g. Student, Faculty).</summary>
    [Required]
    public required string RoleName { get; set; }

    public string? AvatarUrl { get; set; }

    // Privacy-aware contact fields: backend returns null when viewer shouldn't see them.
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

