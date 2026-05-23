using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Scraping;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ScheduleSpiderSyncService : IScheduleSpiderSyncService
{
    private readonly IUnitOfWork _uow;
    private readonly IWebSpiderService _spider;
    private readonly ISpiderUrlResolver _urlResolver;
    private readonly IScrapedEntityResolutionService _resolution;
    private readonly ILogger<ScheduleSpiderSyncService> _logger;

    public ScheduleSpiderSyncService(
        IUnitOfWork uow,
        IWebSpiderService spider,
        ISpiderUrlResolver urlResolver,
        IScrapedEntityResolutionService resolution,
        ILogger<ScheduleSpiderSyncService> logger)
    {
        _uow = uow;
        _spider = spider;
        _urlResolver = urlResolver;
        _resolution = resolution;
        _logger = logger;
    }

    public async Task<SpiderSyncStatsDto> SyncScheduleDatabaseAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        var stats = new SpiderSyncStatsDto();
        var scheduleUrl = _urlResolver.ResolveSchedulePageUrl(organizationId);
        if (string.IsNullOrWhiteSpace(scheduleUrl))
        {
            _logger.LogWarning("No Spider schedule URL configured for organization {OrganizationId}. Skipping sync.", organizationId);
            return stats;
        }

        SiteScheduleExtractionResult extraction;
        try
        {
            extraction = await _spider.ExtractScheduleFromSiteAsync(scheduleUrl, maxSchedulePages: 120, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Schedule site extraction failed for organization {OrganizationId}.", organizationId);
            throw;
        }

        var scraped = extraction.Events;
        if (scraped.Count == 0)
        {
            _logger.LogWarning("No scraped rows from schedule URL for organization {OrganizationId}.", organizationId);
            return stats;
        }
        var maps = await _resolution.BuildMapsAsync(organizationId, scraped, cancellationToken);

        var scrapedWithKeys = scraped
            .Select(dto => (Dto: dto, Key: BuildNaturalKey(dto), Hash: ScrapedEventHasher.CalculateHash(dto)))
            .ToList();

        var scrapedKeys = scrapedWithKeys.Select(x => x.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var existing = (await _uow.Repository<ScrapedClassEvent>()
                .FindAsync(e => e.OrganizationId == organizationId))
            .ToList();

        var existingByKey = existing
            .GroupBy(e => BuildNaturalKey(e))
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        foreach (var item in scrapedWithKeys)
        {
            stats.Processed++;
            var profKey = NormalizeKeyPart(item.Dto.Professor);
            var roomKey = NormalizeKeyPart(item.Dto.Room);
            maps.HostByProfessorKey.TryGetValue(profKey, out var hostId);
            maps.RoomByRoomTextKey.TryGetValue(roomKey, out var roomId);

            if (existingByKey.TryGetValue(item.Key, out var entity))
            {
                if (!string.Equals(entity.DataHash, item.Hash, StringComparison.Ordinal))
                {
                    ApplyDto(entity, item.Dto);
                    entity.DataHash = item.Hash;
                    entity.IsChanged = true;
                    entity.HostId = hostId;
                    entity.RoomId = roomId;
                    _uow.Repository<ScrapedClassEvent>().Update(entity);
                    stats.Updated++;
                }
                else
                {
                    var needsUpdate = false;
                    if (entity.IsChanged)
                    {
                        entity.IsChanged = false;
                        needsUpdate = true;
                    }

                    if (entity.HostId != hostId || entity.RoomId != roomId)
                    {
                        entity.HostId = hostId;
                        entity.RoomId = roomId;
                        needsUpdate = true;
                    }

                    if (needsUpdate)
                    {
                        _uow.Repository<ScrapedClassEvent>().Update(entity);
                        stats.Updated++;
                    }
                    else
                    {
                        stats.Skipped++;
                    }
                }
            }
            else
            {
                var newEntity = new ScrapedClassEvent
                {
                    OrganizationId = organizationId,
                    ClassName = item.Dto.ClassName,
                    Time = item.Dto.Time,
                    RoomText = item.Dto.Room,
                    Professor = item.Dto.Professor,
                    GroupNumber = item.Dto.GroupNumber,
                    ActivityType = item.Dto.ActivityType,
                    DataHash = item.Hash,
                    IsChanged = false,
                    HostId = hostId,
                    RoomId = roomId
                };
                await _uow.Repository<ScrapedClassEvent>().AddAsync(newEntity);
                stats.Created++;
            }
        }

        var toRemove = existing
            .Where(e => !scrapedKeys.Contains(BuildNaturalKey(e)))
            .ToList();

        foreach (var entity in toRemove)
        {
            _uow.Repository<ScrapedClassEvent>().Remove(entity);
            stats.Removed++;
        }

        await _uow.CompleteAsync();
        return stats;
    }

    private static string BuildNaturalKey(ScrapedEventDto dto) =>
        string.Join("||",
            NormalizeKeyPart(dto.ClassName),
            NormalizeKeyPart(dto.Time),
            NormalizeKeyPart(dto.GroupNumber));

    private static string BuildNaturalKey(ScrapedClassEvent e) =>
        string.Join("||",
            NormalizeKeyPart(e.ClassName),
            NormalizeKeyPart(e.Time),
            NormalizeKeyPart(e.GroupNumber));

    private static string NormalizeKeyPart(string? value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();

    private static void ApplyDto(ScrapedClassEvent entity, ScrapedEventDto dto)
    {
        entity.ClassName = dto.ClassName;
        entity.Time = dto.Time;
        entity.RoomText = dto.Room;
        entity.Professor = dto.Professor;
        entity.GroupNumber = dto.GroupNumber;
        entity.ActivityType = dto.ActivityType;
    }
}
