using Omada.Api.DTOs.Common;

namespace Omada.Api.DTOs.Search;

public class UniversalSearchRequest : PagedRequest
{
    /// <summary>Free-text query (min 2 characters).</summary>
    public string Q { get; set; } = string.Empty;

    /// <summary>Optional subset of <see cref="SearchTypes"/> to query. When omitted, all permitted types are searched.</summary>
    public List<string>? Types { get; set; }

    /// <summary>Maximum hits per result group (default 8, max 20).</summary>
    public int LimitPerType { get; set; } = 8;
}
