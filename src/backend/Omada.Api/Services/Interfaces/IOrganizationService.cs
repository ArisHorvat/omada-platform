using Omada.Api.Entities;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common; // Add this

namespace Omada.Api.Services.Interfaces;

public interface IOrganizationService
{
    // Change Result to ServiceResponse
    Task<ServiceResponse<OrganizationDetailsDto>> CreateOrganizationAsync(RegisterOrganizationRequest request);
    Task<ServiceResponse<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request);
    Task<ServiceResponse<bool>> DeleteOrganizationAsync(Guid id); 
    Task<ServiceResponse<PagedResponse<OrganizationDetailsDto>>> GetAllAsync(PagedRequest request);
    Task<ServiceResponse<OrganizationDetailsDto>> GetByIdAsync(Guid id);
}