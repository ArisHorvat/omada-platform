using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Omada.Api.Data;

namespace Omada.Api.Infrastructure.Security;

public interface IPermissionCacheInvalidator
{
    Task InvalidateOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
}

public class PermissionCacheInvalidator : IPermissionCacheInvalidator
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;

    public PermissionCacheInvalidator(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task InvalidateOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        var userIds = await _context.OrganizationMembers
            .AsNoTracking()
            .Where(m => m.OrganizationId == organizationId)
            .Select(m => m.UserId)
            .ToListAsync(cancellationToken);

        foreach (var userId in userIds)
            _cache.Remove($"permissions_{userId}_{organizationId}");
    }
}
