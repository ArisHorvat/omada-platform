using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.News;

public class NewsItemDto
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Title { get; set; }
    [Required] public required string Content { get; set; }
    [Required] public required NewsType Type { get; set; }
    [Required] public required NewsCategory Category { get; set; }
    [Required] public required DateTime CreatedAt { get; set; }
    [Required] public required string AuthorName { get; set; } // Extra value for the UI!
    
    public string? CoverImageUrl { get; set; }
}