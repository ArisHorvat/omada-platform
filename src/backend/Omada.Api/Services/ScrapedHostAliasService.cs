using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Organizations;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ScrapedHostAliasService : IScrapedHostAliasService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContext _userContext;

    public ScrapedHostAliasService(ApplicationDbContext context, IUserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>> GetAliasesAsync(CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var aliases = await GetAliasesForOrgAsync(orgId, cancellationToken);
        return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(true, aliases);
    }

    public async Task<ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>> SaveAliasesAsync(
        SaveScrapedHostAliasesRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == orgId && !o.IsDeleted, cancellationToken);
        if (org == null)
            return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(false, null!,
                new AppError(ErrorCodes.NotFound, "Organization not found."));

        var existing = ScrapedHostAliasJson.Parse(org.ScrapedHostAliasesJson);
        var merged = ScrapedHostAliasJson.Merge(existing, request.Aliases ?? new List<ScrapedHostAliasDto>());
        org.ScrapedHostAliasesJson = ScrapedHostAliasJson.Serialize(merged);
        await _context.SaveChangesAsync(cancellationToken);

        return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(true, merged);
    }

    public async Task<ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>> LinkHostAliasAsync(
        LinkScrapedHostAliasRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ScrapedLabel))
            return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(false, null!,
                new AppError(ErrorCodes.InvalidInput, "Scraped label is required."));

        if (request.HostUserId == Guid.Empty)
            return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(false, null!,
                new AppError(ErrorCodes.InvalidInput, "Member is required."));

        var orgId = _userContext.OrganizationId;
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == orgId && !o.IsDeleted, cancellationToken);
        if (org == null)
            return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(false, null!,
                new AppError(ErrorCodes.NotFound, "Organization not found."));

        var displayName = request.HostDisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = await _context.Users.AsNoTracking()
                .Where(u => u.Id == request.HostUserId)
                .Select(u => (u.FirstName + " " + u.LastName).Trim())
                .FirstOrDefaultAsync(cancellationToken);
        }

        var existing = ScrapedHostAliasJson.Parse(org.ScrapedHostAliasesJson);
        var prior = existing.FirstOrDefault(a =>
            string.Equals(a.ScrapedLabel.Trim(), request.ScrapedLabel.Trim(), StringComparison.OrdinalIgnoreCase));
        var matchNames = ScrapedHostAliasPropagation.CollectMatchNames(
            request.ScrapedLabel,
            prior?.PendingDisplayName);

        var merged = ScrapedHostAliasJson.Merge(existing, new List<ScrapedHostAliasDto>
        {
            new()
            {
                ScrapedLabel = request.ScrapedLabel.Trim(),
                HostUserId = request.HostUserId,
                HostDisplayName = string.IsNullOrWhiteSpace(displayName) ? null : displayName,
            }
        });
        org.ScrapedHostAliasesJson = ScrapedHostAliasJson.Serialize(merged);
        await _context.SaveChangesAsync(cancellationToken);

        await ScrapedHostAliasPropagation.PropagateAsync(
            _context,
            orgId,
            request.HostUserId,
            matchNames,
            cancellationToken);

        return new ServiceResponse<IReadOnlyList<ScrapedHostAliasDto>>(true, merged);
    }

    public async Task<IReadOnlyList<ScrapedHostAliasDto>> GetAliasesForOrgAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        var json = await _context.Organizations.AsNoTracking()
            .Where(o => o.Id == organizationId && !o.IsDeleted)
            .Select(o => o.ScrapedHostAliasesJson)
            .FirstOrDefaultAsync(cancellationToken);

        return ScrapedHostAliasJson.Parse(json);
    }

    public async Task TryLinkAliasesToUserAsync(
        Guid organizationId,
        Guid userId,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default)
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId && !o.IsDeleted, cancellationToken);
        if (org == null)
            return;

        var aliases = ScrapedHostAliasJson.Parse(org.ScrapedHostAliasesJson);
        if (aliases.Count == 0)
            return;

        var display = $"{firstName} {lastName}".Trim();
        if (string.IsNullOrWhiteSpace(display))
            return;

        var changed = false;
        var propagatedLabels = new List<(string ScrapedLabel, string? PendingDisplayName)>();
        foreach (var alias in aliases)
        {
            if (alias.HostUserId.HasValue)
                continue;

            var pending = alias.PendingDisplayName?.Trim();
            if (string.IsNullOrWhiteSpace(pending))
                continue;

            if (!NamesLikelyMatch(pending, display))
                continue;

            propagatedLabels.Add((alias.ScrapedLabel.Trim(), pending));
            alias.HostUserId = userId;
            alias.HostDisplayName = display;
            alias.PendingDisplayName = null;
            changed = true;
        }

        if (!changed)
            return;

        org.ScrapedHostAliasesJson = ScrapedHostAliasJson.Serialize(aliases);
        await _context.SaveChangesAsync(cancellationToken);

        foreach (var (scrapedLabel, pendingDisplayName) in propagatedLabels)
        {
            var matchNames = ScrapedHostAliasPropagation.CollectMatchNames(scrapedLabel, pendingDisplayName);
            await ScrapedHostAliasPropagation.PropagateAsync(
                _context,
                organizationId,
                userId,
                matchNames,
                cancellationToken);
        }
    }

    public async Task PersistProfessorMappingsAsync(
        Guid organizationId,
        ScrapedImportMappingsDto? mappings,
        CancellationToken cancellationToken = default)
    {
        if (mappings == null)
            return;

        var incoming = new List<ScrapedHostAliasDto>();

        foreach (var (label, hostId) in mappings.ProfessorToHostId)
        {
            if (string.IsNullOrWhiteSpace(label) || hostId is not { } id || id == Guid.Empty)
                continue;

            incoming.Add(new ScrapedHostAliasDto
            {
                ScrapedLabel = label.Trim(),
                HostUserId = id,
            });
        }

        foreach (var (label, displayName) in mappings.ProfessorToDisplayName)
        {
            if (string.IsNullOrWhiteSpace(label) || string.IsNullOrWhiteSpace(displayName))
                continue;

            incoming.Add(new ScrapedHostAliasDto
            {
                ScrapedLabel = label.Trim(),
                PendingDisplayName = displayName.Trim(),
            });
        }

        if (incoming.Count == 0)
            return;

        var org = await _context.Organizations.FirstOrDefaultAsync(
            o => o.Id == organizationId && !o.IsDeleted,
            cancellationToken);
        if (org == null)
            return;

        var hostIds = incoming
            .Where(a => a.HostUserId is { } id && id != Guid.Empty)
            .Select(a => a.HostUserId!.Value)
            .Distinct()
            .ToList();

        var displayByUserId = hostIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _context.Users.AsNoTracking()
                .Where(u => hostIds.Contains(u.Id))
                .Select(u => new { u.Id, Name = (u.FirstName + " " + u.LastName).Trim() })
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);

        foreach (var row in incoming.Where(a => a.HostUserId is { } id && id != Guid.Empty))
        {
            if (displayByUserId.TryGetValue(row.HostUserId!.Value, out var name) && !string.IsNullOrWhiteSpace(name))
                row.HostDisplayName = name;
        }

        var existing = ScrapedHostAliasJson.Parse(org.ScrapedHostAliasesJson);
        org.ScrapedHostAliasesJson = ScrapedHostAliasJson.Serialize(ScrapedHostAliasJson.Merge(existing, incoming));
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static bool NamesLikelyMatch(string pending, string memberDisplay)
    {
        var a = NormalizeName(pending);
        var b = NormalizeName(memberDisplay);
        if (a.Length == 0 || b.Length == 0)
            return false;
        return a == b || a.Contains(b, StringComparison.Ordinal) || b.Contains(a, StringComparison.Ordinal);
    }

    private static string NormalizeName(string value) =>
        new string(value.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
}
