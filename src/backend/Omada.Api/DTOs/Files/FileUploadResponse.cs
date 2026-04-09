using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Files;

public class FileUploadResponse
{
    [Required]
    public required string Url { get; set; }
}