using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Chat;

public class MessageDto
{
    [Required]
    public required Guid Id { get; set; }
    
    [Required]
    public required Guid UserId { get; set; }
    
    [Required]
    public required string UserName { get; set; }
    
    [Required]
    public required string Content { get; set; }
    
    [Required]
    public required DateTime CreatedAt { get; set; }
}