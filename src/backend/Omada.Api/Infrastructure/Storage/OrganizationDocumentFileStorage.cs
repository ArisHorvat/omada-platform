namespace Omada.Api.Infrastructure.Storage;

/// <summary>
/// Local disk storage under <c>{ContentRoot}/storage/org-documents/</c> (outside wwwroot).
/// </summary>
public sealed class OrganizationDocumentFileStorage : IOrganizationDocumentStorage
{
    private readonly string _rootPath;

    public OrganizationDocumentFileStorage(IWebHostEnvironment env)
    {
        _rootPath = Path.Combine(env.ContentRootPath, "storage", "org-documents");
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(
        Guid organizationId,
        string storedFileName,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var relative = $"{organizationId:N}/{storedFileName}";
        var fullPath = GetFullPath(relative);
        var dir = Path.GetDirectoryName(fullPath)!;
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        await using var fileStream = new FileStream(
            fullPath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None);
        await content.CopyToAsync(fileStream, cancellationToken);
        return relative.Replace('\\', '/');
    }

    public Task<Stream> OpenReadAsync(string storageRelativePath, CancellationToken cancellationToken = default)
    {
        var fullPath = GetFullPath(storageRelativePath);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Document file was not found on disk.", fullPath);

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storageRelativePath, CancellationToken cancellationToken = default)
    {
        var fullPath = GetFullPath(storageRelativePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }

    private string GetFullPath(string storageRelativePath)
    {
        var normalized = storageRelativePath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        var combined = Path.GetFullPath(Path.Combine(_rootPath, normalized));
        if (!combined.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid document storage path.");
        return combined;
    }
}
