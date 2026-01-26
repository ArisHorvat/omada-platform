namespace Omada.Api.Repositories.Interfaces;

public interface ICustomDataRepository
{
    Task<IEnumerable<dynamic>> GetDataAsync(Guid organizationId, string widgetKey, int page = 1, int pageSize = 50);
    Task SaveDataAsync(Guid organizationId, string widgetKey, object data);
    Task UpdateDataAsync(Guid id, object data);
    Task DeleteDataAsync(Guid id);
}