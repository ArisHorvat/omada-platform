using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Documents;

namespace Omada.Api.Services.Interfaces;

public interface IOrganizationDocumentService
{
    Task<ServiceResponse<PagedResponse<OrganizationDocumentDto>>> ListAsync(OrganizationDocumentListRequest request);
    Task<ServiceResponse<OrganizationDocumentDto>> GetByIdAsync(Guid id);
    Task<ServiceResponse<OrganizationDocumentDto>> UploadAsync(
        IFormFile file,
        string? title,
        string? category,
        string? description);
    Task<ServiceResponse<OrganizationDocumentDto>> UpdateAsync(Guid id, UpdateOrganizationDocumentRequest request);
    Task<ServiceResponse<bool>> DeleteAsync(Guid id);
    Task<(OrganizationDocumentDto? Meta, Stream? Content, string? DownloadName)> OpenDownloadAsync(Guid id);
    ServiceResponse<List<DocumentCategoryDto>> GetCategories();
}
