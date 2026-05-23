using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services.Interfaces;

public interface IAuditLogService
{
    Task RecordAsync(
        Guid organizationId,
        Guid actorUserId,
        string action,
        string summary,
        string? entityType = null,
        Guid? entityId = null,
        string? detailsJson = null);

    Task<ServiceResponse<PagedResponse<AuditLogDto>>> GetForCurrentOrganizationAsync(PagedRequest request);

    Task<ServiceResponse<PagedResponse<AuditLogDto>>> GetPlatformWideAsync(PagedRequest request, Guid? organizationId);
}
