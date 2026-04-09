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
    private readonly IConfiguration _configuration;
    private readonly IScrapedEntityResolutionService _resolution;
    private readonly ILogger<ScheduleSpiderSyncService> _logger;

    public ScheduleSpiderSyncService(
        IUnitOfWork uow,
        IWebSpiderService spider,
        IConfiguration configuration,
        IScrapedEntityResolutionService resolution,
        ILogger<ScheduleSpiderSyncService> logger)
    {
        _uow = uow;
        _spider = spider;
        _configuration = configuration;
        _resolution = resolution;
        _logger = logger;
    }

    public async Task SyncScheduleDatabaseAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        var scheduleUrl = ResolveSchedulePageUrl(organizationId);
        if (string.IsNullOrWhiteSpace(scheduleUrl))
        {
            _logger.LogWarning("No Spider schedule URL configured for organization {OrganizationId}. Skipping sync.", organizationId);
            return;
        }

        var html = await _spider.FetchSchedulePageHtmlAsync(scheduleUrl, cancellationToken);
        if (string.IsNullOrWhiteSpace(html))
        {
            _logger.LogWarning("Empty HTML from schedule URL for organization {OrganizationId}.", organizationId);
            return;
        }

        var scraped = await _spider.ExtractScheduleFromTableAsync(html, cancellationToken);
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
                        _uow.Repository<ScrapedClassEvent>().Update(entity);
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
                    DataHash = item.Hash,
                    IsChanged = false,
                    HostId = hostId,
                    RoomId = roomId
                };
                await _uow.Repository<ScrapedClassEvent>().AddAsync(newEntity);
            }
        }

        var toRemove = existing
            .Where(e => !scrapedKeys.Contains(BuildNaturalKey(e)))
            .ToList();

        foreach (var entity in toRemove)
            _uow.Repository<ScrapedClassEvent>().Remove(entity);

        await _uow.CompleteAsync();
    }

    private string? ResolveSchedulePageUrl(Guid organizationId)
    {
        var perOrg = _configuration[$"Spider:Organizations:{organizationId}:SchedulePageUrl"];
        if (!string.IsNullOrWhiteSpace(perOrg))
            return perOrg.Trim();

        return _configuration["Spider:DefaultSchedulePageUrl"]?.Trim();
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
    }
}
