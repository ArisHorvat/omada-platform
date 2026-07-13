namespace Omada.Api.Entities;

/// <summary>
/// Corporate org file repository metadata. Binary content is stored on disk behind
/// <see cref="Infrastructure.Storage.IOrganizationDocumentStorage"/> (not public static files).
/// </summary>
public class OrganizationDocument : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid UploadedByUserId { get; set; }

    /// <summary>Display name shown in the library (may differ from the original file name).</summary>
    public string Title { get; set; } = string.Empty;

    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long ByteSize { get; set; }

    /// <summary>Relative path under the org-documents storage root (org id segment included).</summary>
    public string StorageRelativePath { get; set; } = string.Empty;

    /// <summary>Folder key — see <see cref="Infrastructure.Constants.DocumentCategories"/>.</summary>
    public string Category { get; set; } = Infrastructure.Constants.DocumentCategories.General;

    public string? Description { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual User UploadedBy { get; set; } = null!;
}
