using Omada.Api.Entities;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services.Interfaces;

public interface IOrganizationService
{
    Task<Result<Organization>> CreateOrganizationAsync(RegisterOrganizationRequest request);
    Task<Result<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request);
    Task<Result<bool>> DeleteOrganizationAsync(Guid id);
    
    // Wrapped in Result
    Task<Result<IEnumerable<OrganizationDetailsDto>>> GetAllAsync();
    Task<Result<OrganizationDetailsDto>> GetByIdAsync(Guid id);
}