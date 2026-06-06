using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services.Interfaces;

public interface IOrganizationAdminService
{
    Task<ServiceResponse<OrganizationDetailsDto>> GetCurrentAsync();
    Task<ServiceResponse<OrganizationDetailsDto>> UpdateCurrentAsync(UpdateCurrentOrganizationRequest request);
    Task<ServiceResponse<RegenerateInviteCodeResponse>> RegenerateInviteCodeAsync();
    Task<ServiceResponse<PagedResponse<OrganizationMemberDto>>> GetMembersAsync(PagedRequest request, string? q, Guid? roleId);
    Task<ServiceResponse<int>> InviteMembersAsync(InviteMembersRequest request);
    Task<ServiceResponse<OrganizationMemberDto>> UpdateMemberAsync(Guid userId, UpdateOrganizationMemberRequest request);
    Task<ServiceResponse<bool>> DeleteMemberAsync(Guid userId);
    Task<ServiceResponse<IEnumerable<OrganizationRoleDto>>> GetRolesAsync();
    Task<ServiceResponse<OrganizationRoleDetailDto>> GetRoleDetailAsync(Guid roleId);
    Task<ServiceResponse<OrganizationRoleDto>> CreateRoleAsync(CreateOrganizationRoleRequest request);
    Task<ServiceResponse<OrganizationRoleDto>> UpdateRoleAsync(Guid roleId, UpdateOrganizationRoleRequest request);
    Task<ServiceResponse<bool>> DeleteRoleAsync(Guid roleId);
    Task<ServiceResponse<OrganizationRoleDetailDto>> UpdateRolePermissionsAsync(Guid roleId, UpdateRolePermissionsRequest request);
    Task<ServiceResponse<IEnumerable<WidgetCatalogItemDto>>> GetWidgetCatalogAsync();
    Task<ServiceResponse<IEnumerable<OrganizationPeriodDto>>> GetPeriodsAsync();
    Task<ServiceResponse<OrganizationPeriodDto>> CreatePeriodAsync(CreateOrganizationPeriodRequest request);
    Task<ServiceResponse<OrganizationPeriodDto>> UpdatePeriodAsync(Guid periodId, UpdateOrganizationPeriodRequest request);
    Task<ServiceResponse<bool>> DeletePeriodAsync(Guid periodId);
    Task<ServiceResponse<OrganizationDetailsDto>> UpdateEnabledWidgetsAsync(UpdateOrganizationEnabledWidgetsRequest request);
    Task<ServiceResponse<PagedResponse<AuditLogDto>>> GetAuditLogsAsync(PagedRequest request);
}
