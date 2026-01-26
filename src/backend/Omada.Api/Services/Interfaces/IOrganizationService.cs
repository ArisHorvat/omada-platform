using Omada.Api.Entities;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services.Interfaces
{
    public interface IOrganizationService
    {
        Task<Result<Organization>> CreateOrganizationAsync(RegisterOrganizationRequest request);
        Task<IEnumerable<OrganizationDetailsDto>> GetAllAsync();
        Task<OrganizationDetailsDto?> GetByIdAsync(Guid id);
        Task<Result<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request);
        Task<Result<bool>> DeleteOrganizationAsync(Guid id);
    }
}