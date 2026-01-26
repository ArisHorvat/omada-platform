using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface ITaskRepository
{
    Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId);
    Task CreateAsync(TaskItem task);
    Task UpdateAsync(TaskItem task);
    Task DeleteAsync(Guid id, Guid userId);
}