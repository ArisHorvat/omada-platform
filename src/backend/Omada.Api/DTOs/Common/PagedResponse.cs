using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Common;

public class PagedResponse<T>
{
    [Required]
    public required IEnumerable<T> Items { get; set; }
    
    [Required]
    public required int TotalCount { get; set; }
    
    [Required]
    public required int Page { get; set; }
    
    [Required]
    public required int PageSize { get; set; }
    
    // Computed property, NSwag will read this perfectly!
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize); 
}