using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Omada.Api.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<T> Repository<T>() where T : class;
    Task<int> CompleteAsync(); // Saves everything at once
    EntityEntry<T> Entry<T>(T entity) where T : class;
}