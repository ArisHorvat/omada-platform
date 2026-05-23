using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Search;

public class UniversalSearchResponse
{
    [Required]
    public required string Query { get; set; }

    [Required]
    public required List<SearchResultGroupDto> Groups { get; set; }
}
