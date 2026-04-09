using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    internal DbSet<T> dbSet;

    public GenericRepository(ApplicationDbContext context)
    {
        _context = context;
        dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        // Read-optimized; callers that mutate call Update(), which attaches the entity.
        return await dbSet.AsNoTracking().FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await dbSet.AsNoTracking().ToListAsync();
    }

    /// <summary>Tracked query — use when entities will be modified (auth token rotation, news update, etc.).</summary>
    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await dbSet.Where(predicate).ToListAsync();
    }

    public async Task<PagedResponse<T>> GetPagedAsync(int page, int pageSize, Expression<Func<T, bool>>? predicate = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null)
    {
        IQueryable<T> query = dbSet.AsNoTracking();

        // 1. Apply the filter if one was provided (e.g., UserId == id)
        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        if (orderBy != null)
        {
            query = orderBy(query);
        }

        // 2. Count the total items matching the filter BEFORE paginating
        var totalCount = await query.CountAsync();

        // 3. Apply Pagination and execute the SQL query
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 4. Return the standardized wrapper
        return new PagedResponse<T>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task AddAsync(T entity)
    {
        await dbSet.AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await dbSet.AddRangeAsync(entities);
    }

    public void Update(T entity)
    {
        dbSet.Attach(entity);
        _context.Entry(entity).State = EntityState.Modified;
    }

    public void Remove(T entity)
    {
        if (entity is BaseEntity baseEntity)
        {
            // If it supports soft delete, just mark it and update
            baseEntity.IsDeleted = true;
            baseEntity.UpdatedAt = DateTime.UtcNow;
            _context.Entry(entity).State = EntityState.Modified;
        }
        else
        {
            // Fallback for entities that don't inherit BaseEntity (e.g. Join Tables)
            dbSet.Remove(entity);
        }
    }

    public IQueryable<T> GetQueryable()
    {
        return dbSet.AsQueryable();
    }
}