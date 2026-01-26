using System.Data;

namespace Omada.Api.Repositories.Interfaces;

public interface IWidgetRepository
{
    Task SetEnabledWidgetsAsync(Guid organizationId, IEnumerable<string> widgetKeys, IDbTransaction transaction);
    Task<IEnumerable<string>> GetEnabledWidgetsAsync(Guid organizationId);
}