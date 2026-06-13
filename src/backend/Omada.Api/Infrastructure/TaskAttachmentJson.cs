using System.Text.Json;
using Omada.Api.DTOs.Tasks;

namespace Omada.Api.Infrastructure;

public static class TaskAttachmentJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static IReadOnlyList<TaskAttachmentDto> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Array.Empty<TaskAttachmentDto>();

        try
        {
            return JsonSerializer.Deserialize<List<TaskAttachmentDto>>(json, Options) ?? new List<TaskAttachmentDto>();
        }
        catch (JsonException)
        {
            return Array.Empty<TaskAttachmentDto>();
        }
    }

    public static string? Serialize(IReadOnlyList<TaskAttachmentDto>? attachments)
    {
        if (attachments == null || attachments.Count == 0)
            return null;

        var cleaned = attachments
            .Where(a => !string.IsNullOrWhiteSpace(a.Url))
            .Select(a => new TaskAttachmentDto
            {
                Url = a.Url.Trim(),
                FileName = string.IsNullOrWhiteSpace(a.FileName) ? null : a.FileName.Trim(),
                ContentType = string.IsNullOrWhiteSpace(a.ContentType) ? null : a.ContentType.Trim(),
                Kind = string.IsNullOrWhiteSpace(a.Kind) ? "material" : a.Kind.Trim().ToLowerInvariant(),
                UploadedAt = a.UploadedAt,
                UploadedByUserId = a.UploadedByUserId
            })
            .ToList();

        return cleaned.Count == 0 ? null : JsonSerializer.Serialize(cleaned, Options);
    }
}
