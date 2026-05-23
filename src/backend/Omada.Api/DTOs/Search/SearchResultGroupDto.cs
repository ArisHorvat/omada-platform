using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Search;

public class SearchResultGroupDto
{
    [Required]
    public required string Type { get; set; }

    [Required]
    public required string Label { get; set; }

    [Required]
    public required int TotalCount { get; set; }

    [Required]
    public required List<SearchHitDto> Items { get; set; }
}
