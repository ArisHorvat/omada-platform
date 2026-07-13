namespace Omada.Api.DTOs.Organizations;

public class ScrapedHostAliasDto
{
    public required string ScrapedLabel { get; set; }

    public Guid? HostUserId { get; set; }

    public string? HostDisplayName { get; set; }

    public string? PendingDisplayName { get; set; }
}

public class SaveScrapedHostAliasesRequest
{
    public List<ScrapedHostAliasDto> Aliases { get; set; } = new();
}

public class LinkScrapedHostAliasRequest
{
    public required string ScrapedLabel { get; set; }

    public Guid HostUserId { get; set; }

    public string? HostDisplayName { get; set; }
}
