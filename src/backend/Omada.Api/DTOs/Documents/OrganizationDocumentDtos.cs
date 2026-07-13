using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Common;

namespace Omada.Api.DTOs.Documents;

public class OrganizationDocumentDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string OriginalFileName { get; set; }

    [Required]
    public required string ContentType { get; set; }

    [Required]
    public required long ByteSize { get; set; }

    [Required]
    public required string Category { get; set; }

    public string? Description { get; set; }

    [Required]
    public required string UploadedByName { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

public class OrganizationDocumentListRequest : PagedRequest
{
    public string? Q { get; set; }
    public string? Category { get; set; }
}

public class UpdateOrganizationDocumentRequest
{
    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Category { get; set; }

    public string? Description { get; set; }
}

public class DocumentCategoryDto
{
    [Required]
    public required string Key { get; set; }

    [Required]
    public required string Label { get; set; }
}
