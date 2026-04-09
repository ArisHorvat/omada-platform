using System.Linq.Expressions;
using Omada.Api.DTOs.Common;

namespace Omada.Api.Repositories.Interfaces;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<PagedResponse<T>> GetPagedAsync(int page, int pageSize, Expression<Func<T, bool>>? predicate = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null);
    Task AddAsync(T entity);
    void Update(T entity); // EF tracks changes, so Update is synchronous
    void Remove(T entity);
    IQueryable<T> GetQueryable();
}
