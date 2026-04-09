using Microsoft.EntityFrameworkCore.ChangeTracking;
using Omada.Api.Data;
using Omada.Api.Repositories.Interfaces;
using System.Collections;

namespace Omada.Api.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private Hashtable _repositories; // Caches repository instances

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        _repositories = new Hashtable();
    }

    public IGenericRepository<T> Repository<T>() where T : class
    {
        var type = typeof(T).Name;

        if (!_repositories.ContainsKey(type))
        {
            var repositoryType = typeof(GenericRepository<>);
            var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(T)), _context);

            _repositories.Add(type, repositoryInstance);
        }

        return (IGenericRepository<T>)_repositories[type]!;
    }

    // This is the magic method. Call this ONCE at the end of your service method.
    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public EntityEntry<T> Entry<T>(T entity) where T : class
    {
        return _context.Entry(entity);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}