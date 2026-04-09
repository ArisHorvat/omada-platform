using Omada.Api.DTOs.Common;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface ITaskRepository : IGenericRepository<TaskItem>
{
    Task<PagedResponse<TaskItem>> GetPagedForUserAsync(Guid organizationId, Guid userId, int page, int pageSize);

    Task<TaskItem?> GetByIdForUserReadAsync(Guid id, Guid organizationId, Guid userId);

    Task<TaskItem?> GetByIdForUserMutationAsync(Guid id, Guid organizationId, Guid userId);
}
