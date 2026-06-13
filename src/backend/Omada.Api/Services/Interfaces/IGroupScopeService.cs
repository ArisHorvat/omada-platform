namespace Omada.Api.Services.Interfaces;

/// <summary>
/// Resolves group tree scope: descendants, ancestors, and rollup membership for admin UX.
/// Students are placed once (usually on a leaf); parent groups aggregate descendant members.
/// </summary>
public interface IGroupScopeService
{
    /// <summary>Group id plus all nested sub-groups.</summary>
    Task<HashSet<Guid>> GetDescendantIdsAsync(Guid organizationId, Guid groupId, bool includeSelf = true);

    /// <summary>Direct group ids plus every ancestor up the tree (for schedule/offering visibility).</summary>
    Task<HashSet<Guid>> ExpandWithAncestorsAsync(Guid organizationId, IEnumerable<Guid> groupIds);

    /// <summary>Distinct user ids with a membership in this group or any descendant.</summary>
    Task<HashSet<Guid>> GetMemberUserIdsInScopeAsync(Guid organizationId, Guid groupId);

    /// <summary>Unique member count per group including all descendants (for tree badges).</summary>
    Task<Dictionary<Guid, int>> GetRollupMemberCountsAsync(Guid organizationId);

    /// <summary>Depth from root of tree (0 = top-level group).</summary>
    Task<int> GetDepthAsync(Guid organizationId, Guid groupId);

    /// <summary>Depth for many groups in one tree load.</summary>
    Task<Dictionary<Guid, int>> GetDepthsAsync(Guid organizationId, IEnumerable<Guid> groupIds);
}
