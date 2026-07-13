using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class GroupScopeService : IGroupScopeService
{
    private readonly ApplicationDbContext _context;

    private Guid _cachedOrgId;
    private Dictionary<Guid, Guid?>? _parentById;
    private Dictionary<Guid, List<Guid>>? _childrenByParent;

    public GroupScopeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<HashSet<Guid>> GetDescendantIdsAsync(Guid organizationId, Guid groupId, bool includeSelf = true)
    {
        await EnsureTreeAsync(organizationId);
        var result = new HashSet<Guid>();
        if (includeSelf)
            result.Add(groupId);

        if (_childrenByParent == null)
            return result;

        var queue = new Queue<Guid>();
        queue.Enqueue(groupId);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!_childrenByParent.TryGetValue(current, out var children))
                continue;

            foreach (var childId in children)
            {
                if (result.Add(childId))
                    queue.Enqueue(childId);
            }
        }

        return result;
    }

    public async Task<HashSet<Guid>> ExpandWithAncestorsAsync(Guid organizationId, IEnumerable<Guid> groupIds)
    {
        await EnsureTreeAsync(organizationId);
        var result = new HashSet<Guid>(groupIds);

        if (_parentById == null)
            return result;

        foreach (var groupId in groupIds)
        {
            var cursor = groupId;
            while (_parentById.TryGetValue(cursor, out var parentId) && parentId.HasValue)
            {
                result.Add(parentId.Value);
                cursor = parentId.Value;
            }
        }

        return result;
    }

    public async Task<HashSet<Guid>> GetMemberUserIdsInScopeAsync(Guid organizationId, Guid groupId)
    {
        var scopeIds = await GetDescendantIdsAsync(organizationId, groupId, includeSelf: true);
        if (scopeIds.Count == 0)
            return [];

        var userIds = await _context.GroupMembers
            .AsNoTracking()
            .Where(gm => scopeIds.Contains(gm.GroupId) && gm.Group.OrganizationId == organizationId && !gm.Group.IsDeleted)
            .Select(gm => gm.UserId)
            .Distinct()
            .ToListAsync();

        return userIds.ToHashSet();
    }

    public async Task<Dictionary<Guid, int>> GetRollupMemberCountsAsync(Guid organizationId)
    {
        await EnsureTreeAsync(organizationId);

        var rollupSets = new Dictionary<Guid, HashSet<Guid>>();
        if (_parentById == null)
            return new Dictionary<Guid, int>();

        foreach (var groupId in _parentById.Keys)
            rollupSets[groupId] = new HashSet<Guid>();

        var memberships = await _context.GroupMembers
            .AsNoTracking()
            .Where(gm => gm.Group.OrganizationId == organizationId && !gm.Group.IsDeleted)
            .Select(gm => new { gm.GroupId, gm.UserId })
            .ToListAsync();

        foreach (var row in memberships)
        {
            var cursor = row.GroupId;
            while (_parentById.ContainsKey(cursor))
            {
                if (rollupSets.TryGetValue(cursor, out var set))
                    set.Add(row.UserId);

                if (!_parentById.TryGetValue(cursor, out var parentId) || !parentId.HasValue)
                    break;

                cursor = parentId.Value;
            }
        }

        return rollupSets.ToDictionary(kv => kv.Key, kv => kv.Value.Count);
    }

    public async Task<int> GetDepthAsync(Guid organizationId, Guid groupId)
    {
        await EnsureTreeAsync(organizationId);
        if (_parentById == null || !_parentById.ContainsKey(groupId))
            return 0;

        var depth = 0;
        var cursor = groupId;
        while (_parentById.TryGetValue(cursor, out var parentId) && parentId.HasValue)
        {
            depth++;
            cursor = parentId.Value;
        }

        return depth;
    }

    public async Task<Dictionary<Guid, int>> GetDepthsAsync(Guid organizationId, IEnumerable<Guid> groupIds)
    {
        await EnsureTreeAsync(organizationId);
        var result = new Dictionary<Guid, int>();
        foreach (var groupId in groupIds.Distinct())
        {
            if (!result.ContainsKey(groupId))
                result[groupId] = await GetDepthAsync(organizationId, groupId);
        }

        return result;
    }

    public async Task<HashSet<Guid>> GetUserEffectiveGroupIdsAsync(Guid organizationId, Guid userId)
    {
        var fromMembership = await _context.GroupMembers
            .AsNoTracking()
            .Where(gm => gm.UserId == userId && gm.Group.OrganizationId == organizationId && !gm.Group.IsDeleted)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        var fromCohort = await _context.OfferingEnrollments
            .AsNoTracking()
            .Where(e =>
                e.UserId == userId &&
                e.OrganizationId == organizationId &&
                !e.IsDeleted &&
                e.CohortGroupId != null)
            .Select(e => e.CohortGroupId!.Value)
            .ToListAsync();

        var fromManaged = await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted && g.ManagerId == userId)
            .Select(g => g.Id)
            .ToListAsync();

        var direct = fromMembership.Concat(fromCohort).Concat(fromManaged).Distinct().ToHashSet();
        if (direct.Count == 0)
            return direct;

        return await ExpandWithAncestorsAsync(organizationId, direct);
    }

    private async Task EnsureTreeAsync(Guid organizationId)
    {
        if (_parentById != null && _cachedOrgId == organizationId)
            return;

        _cachedOrgId = organizationId;
        var rows = await _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted)
            .Select(g => new { g.Id, g.ParentGroupId })
            .ToListAsync();

        _parentById = rows.ToDictionary(r => r.Id, r => r.ParentGroupId);
        _childrenByParent = new Dictionary<Guid, List<Guid>>();

        foreach (var row in rows)
        {
            if (!row.ParentGroupId.HasValue)
                continue;

            if (!_childrenByParent.TryGetValue(row.ParentGroupId.Value, out var list))
            {
                list = new List<Guid>();
                _childrenByParent[row.ParentGroupId.Value] = list;
            }

            list.Add(row.Id);
        }
    }
}
