namespace Omada.Api.Infrastructure.Storage;

/// <summary>
/// Persists organization document bytes on the web server file system.
/// Swap this implementation to migrate to external object storage later.
/// </summary>
public interface IOrganizationDocumentStorage
{
    /// <summary>Writes the stream and returns a stable relative path (forward slashes, no leading slash).</summary>
    Task<string> SaveAsync(Guid organizationId, string storedFileName, Stream content, CancellationToken cancellationToken = default);

    /// <summary>Opens a read stream for a previously saved relative path.</summary>
    Task<Stream> OpenReadAsync(string storageRelativePath, CancellationToken cancellationToken = default);

    /// <summary>Deletes the on-disk object if it exists.</summary>
    Task DeleteAsync(string storageRelativePath, CancellationToken cancellationToken = default);
}
