using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Documents;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Infrastructure.Storage;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class OrganizationDocumentService : IOrganizationDocumentService
{
    private const long MaxUploadBytes = 25 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> CategoryLabels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [DocumentCategories.General] = "General",
        [DocumentCategories.Policies] = "Policies & compliance",
        [DocumentCategories.Hr] = "HR & onboarding",
        [DocumentCategories.Templates] = "Templates",
        [DocumentCategories.Projects] = "Project files",
    };

    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IOrganizationDocumentStorage _storage;

    public OrganizationDocumentService(
        IUnitOfWork uow,
        IUserContext userContext,
        IOrganizationDocumentStorage storage)
    {
        _uow = uow;
        _userContext = userContext;
        _storage = storage;
    }

    public async Task<ServiceResponse<PagedResponse<OrganizationDocumentDto>>> ListAsync(
        OrganizationDocumentListRequest request)
    {
        var gate = await EnsureCorporateOrgErrorAsync();
        if (gate != null)
            return FailPaged(gate);

        var orgId = _userContext.OrganizationId;
        var query = _uow.Repository<OrganizationDocument>()
            .GetQueryable()
            .Where(d => d.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var category = DocumentCategories.Normalize(request.Category);
            query = query.Where(d => d.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.Trim().ToLowerInvariant();
            query = query.Where(d =>
                d.Title.ToLower().Contains(q) ||
                d.OriginalFileName.ToLower().Contains(q) ||
                (d.Description != null && d.Description.ToLower().Contains(q)));
        }

        var total = await query.CountAsync();
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        var rows = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var uploaderIds = rows.Select(d => d.UploadedByUserId).Distinct().ToList();
        var uploaders = await _uow.Repository<User>().FindAsync(u => uploaderIds.Contains(u.Id));
        var uploaderNames = uploaders.ToDictionary(
            u => u.Id,
            u => $"{u.FirstName} {u.LastName}".Trim());

        var items = rows.Select(d => MapDto(d, uploaderNames)).ToList();

        return new ServiceResponse<PagedResponse<OrganizationDocumentDto>>(true, new PagedResponse<OrganizationDocumentDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<OrganizationDocumentDto>> GetByIdAsync(Guid id)
    {
        var gate = await EnsureCorporateOrgErrorAsync();
        if (gate != null)
            return Fail<OrganizationDocumentDto>(gate);

        var doc = await _uow.Repository<OrganizationDocument>().GetByIdAsync(id);
        if (doc == null)
            return NotFound<OrganizationDocumentDto>();

        return new ServiceResponse<OrganizationDocumentDto>(true, await MapDtoWithUploaderAsync(doc));
    }

    public async Task<ServiceResponse<OrganizationDocumentDto>> UploadAsync(
        IFormFile file,
        string? title,
        string? category,
        string? description)
    {
        var gate = await EnsureCorporateOrgErrorAsync();
        if (gate != null)
            return Fail<OrganizationDocumentDto>(gate);

        if (file == null || file.Length == 0)
        {
            return Fail<OrganizationDocumentDto>(
                new AppError(ErrorCodes.InvalidInput, "No file uploaded."));
        }

        if (file.Length > MaxUploadBytes)
        {
            return Fail<OrganizationDocumentDto>(
                new AppError(ErrorCodes.InvalidInput, "Files must be 25 MB or smaller."));
        }

        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        var originalName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalName))
            originalName = "document";

        var ext = Path.GetExtension(originalName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".bin";

        var storedFileName = $"{Guid.NewGuid():N}{ext}";
        string relativePath;
        await using (var stream = file.OpenReadStream())
        {
            relativePath = await _storage.SaveAsync(orgId, storedFileName, stream);
        }

        var displayTitle = string.IsNullOrWhiteSpace(title) ? originalName : title.Trim();
        var normalizedCategory = DocumentCategories.Normalize(category);
        var trimmedDescription = string.IsNullOrWhiteSpace(description) ? null : description.Trim();

        var entity = new OrganizationDocument
        {
            OrganizationId = orgId,
            UploadedByUserId = userId,
            Title = displayTitle,
            OriginalFileName = originalName,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            ByteSize = file.Length,
            StorageRelativePath = relativePath,
            Category = normalizedCategory,
            Description = trimmedDescription
        };

        await _uow.Repository<OrganizationDocument>().AddAsync(entity);
        await _uow.CompleteAsync();

        return new ServiceResponse<OrganizationDocumentDto>(true, await MapDtoWithUploaderAsync(entity));
    }

    public async Task<ServiceResponse<OrganizationDocumentDto>> UpdateAsync(
        Guid id,
        UpdateOrganizationDocumentRequest request)
    {
        var gate = await EnsureCorporateOrgErrorAsync();
        if (gate != null)
            return Fail<OrganizationDocumentDto>(gate);

        var doc = (await _uow.Repository<OrganizationDocument>().FindAsync(d => d.Id == id)).FirstOrDefault();
        if (doc == null)
            return NotFound<OrganizationDocumentDto>();

        doc.Title = request.Title.Trim();
        doc.Category = DocumentCategories.Normalize(request.Category);
        doc.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        _uow.Repository<OrganizationDocument>().Update(doc);
        await _uow.CompleteAsync();

        return new ServiceResponse<OrganizationDocumentDto>(true, await MapDtoWithUploaderAsync(doc));
    }

    public async Task<ServiceResponse<bool>> DeleteAsync(Guid id)
    {
        var gate = await EnsureCorporateOrgErrorAsync();
        if (gate != null)
            return Fail<bool>(gate);

        var doc = (await _uow.Repository<OrganizationDocument>().FindAsync(d => d.Id == id)).FirstOrDefault();
        if (doc == null)
            return NotFound<bool>();

        var storagePath = doc.StorageRelativePath;
        _uow.Repository<OrganizationDocument>().Remove(doc);
        await _uow.CompleteAsync();

        try
        {
            await _storage.DeleteAsync(storagePath);
        }
        catch
        {
            // Metadata removed; orphaned bytes are acceptable vs blocking delete.
        }

        return new ServiceResponse<bool>(true, true);
    }

    public async Task<(OrganizationDocumentDto? Meta, Stream? Content, string? DownloadName)> OpenDownloadAsync(Guid id)
    {
        var gate = await EnsureCorporateOrgErrorAsync();
        if (gate != null)
            return (null, null, null);

        var doc = await _uow.Repository<OrganizationDocument>().GetByIdAsync(id);
        if (doc == null)
            return (null, null, null);

        var meta = await MapDtoWithUploaderAsync(doc);
        try
        {
            var stream = await _storage.OpenReadAsync(doc.StorageRelativePath);
            return (meta, stream, doc.OriginalFileName);
        }
        catch (FileNotFoundException)
        {
            return (null, null, null);
        }
    }

    public ServiceResponse<List<DocumentCategoryDto>> GetCategories()
    {
        var list = DocumentCategories.All
            .Select(key => new DocumentCategoryDto
            {
                Key = key,
                Label = CategoryLabels.TryGetValue(key, out var label) ? label : key
            })
            .ToList();

        return new ServiceResponse<List<DocumentCategoryDto>>(true, list);
    }

    private async Task<AppError?> EnsureCorporateOrgErrorAsync()
    {
        var org = await _uow.Repository<Organization>().GetByIdAsync(_userContext.OrganizationId);
        if (org == null)
            return new AppError(ErrorCodes.NotFound, "Organization not found.");

        if (org.OrganizationType != OrganizationType.Corporate)
            return new AppError(ErrorCodes.Forbidden, "Documents are only available for corporate organizations.");

        return null;
    }

    private async Task<OrganizationDocumentDto> MapDtoWithUploaderAsync(OrganizationDocument doc)
    {
        var uploader = await _uow.Repository<User>().GetByIdAsync(doc.UploadedByUserId);
        var name = uploader == null ? "Unknown" : $"{uploader.FirstName} {uploader.LastName}".Trim();
        return MapDto(doc, new Dictionary<Guid, string> { [doc.UploadedByUserId] = name });
    }

    private static OrganizationDocumentDto MapDto(
        OrganizationDocument doc,
        IReadOnlyDictionary<Guid, string> uploaderNames)
    {
        return new OrganizationDocumentDto
        {
            Id = doc.Id,
            Title = doc.Title,
            OriginalFileName = doc.OriginalFileName,
            ContentType = doc.ContentType,
            ByteSize = doc.ByteSize,
            Category = doc.Category,
            Description = doc.Description,
            UploadedByName = uploaderNames.TryGetValue(doc.UploadedByUserId, out var n) ? n : "Unknown",
            CreatedAt = doc.CreatedAt,
            UpdatedAt = doc.UpdatedAt
        };
    }

    private static ServiceResponse<PagedResponse<OrganizationDocumentDto>> FailPaged(AppError error) =>
        new(false, null, error);

    private static ServiceResponse<T> Fail<T>(AppError error) =>
        new(false, default, error);

    private static ServiceResponse<T> NotFound<T>() =>
        new(false, default, new AppError(ErrorCodes.NotFound, "Document not found."));
}
