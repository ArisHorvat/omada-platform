using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Omada.Api.Data;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

/// <summary>
/// Loads all org members and rooms once per sync (with short-lived cache), then fuzzy-matches in memory.
/// </summary>
public sealed class ScrapedEntityResolutionService : IScrapedEntityResolutionService
{
    private readonly ApplicationDbContext _db;
    private readonly IMemoryCache _cache;

    private static readonly Regex Honorifics = new(
        @"\b(dr\.?|prof\.?|professor|associate|asst\.?|assistant|lecturer|conf\.?|universitar|univ\.?)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public ScrapedEntityResolutionService(ApplicationDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<ScrapedEventResolutionMaps> BuildMapsAsync(
        Guid organizationId,
        IReadOnlyList<ScrapedEventDto> dtos,
        CancellationToken cancellationToken = default)
    {
        if (dtos.Count == 0)
        {
            return new ScrapedEventResolutionMaps();
        }

        var userRows = await GetOrgUserRowsCachedAsync(organizationId, cancellationToken);
        var roomRows = await GetOrgRoomRowsCachedAsync(organizationId, cancellationToken);

        var hostMap = new Dictionary<string, Guid?>(StringComparer.OrdinalIgnoreCase);
        var roomMap = new Dictionary<string, Guid?>(StringComparer.OrdinalIgnoreCase);

        var profGroups = dtos
            .Select(d => (Key: NormalizeKeyPart(d.Professor), Raw: d.Professor))
            .Where(x => !string.IsNullOrEmpty(x.Key))
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase);

        foreach (var g in profGroups)
        {
            var raw = g.First().Raw;
            hostMap[g.Key] = MatchProfessor(raw, userRows);
        }

        var roomGroups = dtos
            .Select(d => (Key: NormalizeKeyPart(d.Room), Raw: d.Room))
            .Where(x => !string.IsNullOrEmpty(x.Key))
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase);

        foreach (var g in roomGroups)
        {
            var raw = g.First().Raw;
            roomMap[g.Key] = MatchRoom(raw, roomRows);
        }

        return new ScrapedEventResolutionMaps
        {
            HostByProfessorKey = hostMap,
            RoomByRoomTextKey = roomMap
        };
    }

    private async Task<List<UserResolutionRow>> GetOrgUserRowsCachedAsync(Guid organizationId, CancellationToken ct)
    {
        var key = $"scraped-resolve:org-users:{organizationId}";
        return await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(10);
            var rows = await _db.OrganizationMembers
                .AsNoTracking()
                .Where(m => m.OrganizationId == organizationId && m.IsActive)
                .Select(m => new UserResolutionRow(
                    m.UserId,
                    m.User.FirstName,
                    m.User.LastName,
                    m.Role.Name))
                .ToListAsync(ct);

            return rows
                .GroupBy(r => r.UserId)
                .Select(g => g.First())
                .ToList();
        }) ?? new List<UserResolutionRow>();
    }

    private async Task<List<RoomResolutionRow>> GetOrgRoomRowsCachedAsync(Guid organizationId, CancellationToken ct)
    {
        var key = $"scraped-resolve:org-rooms:{organizationId}";
        return await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(10);
            return await _db.Rooms
                .AsNoTracking()
                .Where(r => r.OrganizationId == organizationId && !r.IsDeleted)
                .Select(r => new RoomResolutionRow(r.Id, r.Name))
                .ToListAsync(ct);
        }) ?? new List<RoomResolutionRow>();
    }

    private static Guid? MatchProfessor(string? professorRaw, IReadOnlyList<UserResolutionRow> users)
    {
        if (string.IsNullOrWhiteSpace(professorRaw) || users.Count == 0)
            return null;

        var needle = NormalizeForMatch(professorRaw);
        if (needle.Length == 0)
            return null;

        Guid? bestId = null;
        var bestScore = 0;

        foreach (var u in users)
        {
            var full = NormalizeForMatch($"{u.FirstName} {u.LastName}");
            var rev = NormalizeForMatch($"{u.LastName} {u.FirstName}");
            var lastOnly = NormalizeForMatch(u.LastName);
            var role = NormalizeForMatch(u.RoleName);

            var score = MaxScore(needle, full, rev, lastOnly, role);
            if (score > bestScore)
            {
                bestScore = score;
                bestId = u.UserId;
            }
        }

        return bestScore >= 40 ? bestId : null;
    }

    private static int MaxScore(string needle, params string[] haystacks)
    {
        var max = 0;
        foreach (var h in haystacks)
        {
            if (h.Length == 0)
                continue;
            if (needle == h)
                return 100;
            if (needle.Contains(h, StringComparison.Ordinal) || h.Contains(needle, StringComparison.Ordinal))
                max = Math.Max(max, 85);
            else
                max = Math.Max(max, TokenOverlapScore(needle, h));
        }

        return max;
    }

    private static int TokenOverlapScore(string a, string b)
    {
        var ta = a.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var tb = b.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (ta.Count == 0 || tb.Count == 0)
            return 0;
        var inter = ta.Intersect(tb, StringComparer.OrdinalIgnoreCase).Count();
        var union = ta.Union(tb, StringComparer.OrdinalIgnoreCase).Count();
        return (int)(60.0 * inter / union);
    }

    private static Guid? MatchRoom(string? roomRaw, IReadOnlyList<RoomResolutionRow> rooms)
    {
        if (string.IsNullOrWhiteSpace(roomRaw) || rooms.Count == 0)
            return null;

        var needle = NormalizeForMatch(roomRaw);
        var needleKey = AlphanumericKey(roomRaw);
        if (needle.Length == 0 && needleKey.Length == 0)
            return null;

        Guid? bestId = null;
        var bestScore = 0;

        foreach (var r in rooms)
        {
            var name = NormalizeForMatch(r.Name);
            var nameKey = AlphanumericKey(r.Name);
            var score = 0;
            if (needle.Length > 0 && name.Length > 0)
            {
                if (needle == name)
                    score = 100;
                else if (needle.Contains(name, StringComparison.Ordinal) || name.Contains(needle, StringComparison.Ordinal))
                    score = 88;
                else
                    score = TokenOverlapScore(needle, name);
            }

            if (needleKey.Length > 0 && nameKey.Length > 0 && needleKey == nameKey)
                score = Math.Max(score, 95);

            if (score > bestScore)
            {
                bestScore = score;
                bestId = r.Id;
            }
        }

        return bestScore >= 40 ? bestId : null;
    }

    private static string NormalizeForMatch(string? value)
    {
        var s = Honorifics.Replace(value ?? string.Empty, " ");
        s = string.Join(' ', s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).Trim().ToLowerInvariant();
        return s;
    }

    private static string AlphanumericKey(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;
        var chars = value.Where(char.IsLetterOrDigit).ToArray();
        return new string(chars).ToLowerInvariant();
    }

    /// <summary>Aligned with <see cref="ScheduleSpiderSyncService"/> natural-key normalization.</summary>
    private static string NormalizeKeyPart(string? value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();

    private sealed record UserResolutionRow(Guid UserId, string FirstName, string LastName, string RoleName);

    private sealed record RoomResolutionRow(Guid Id, string Name);
}
