using System.Data;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces
{
    public interface IOrganizationRepository
    {
        Task CreateAsync(Organization organization, IDbTransaction transaction);
        Task<bool> ExistsByDomainAsync(string emailDomain);
        Task<IEnumerable<Organization>> GetAllAsync();
        Task<Organization?> GetByIdAsync(Guid id, IDbTransaction? transaction = null);
        Task UpdateAsync(Organization organization, IDbTransaction transaction);
        Task DeleteAsync(Guid id, IDbTransaction transaction);
    }
}
