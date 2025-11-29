using Omada.Api.Entities;
using System.Data;

namespace Omada.Api.Repositories.Interfaces;

public interface IWidgetRepository
{
    Task AddRangeAsync(IEnumerable<Widget> widgets, IDbTransaction transaction);
    Task<IEnumerable<Widget>> GetByOrganizationIdAsync(Guid organizationId);
    Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction);
}