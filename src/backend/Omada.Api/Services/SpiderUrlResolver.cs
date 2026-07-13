using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class SpiderUrlResolver : ISpiderUrlResolver
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public SpiderUrlResolver(ApplicationDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<SpiderConfigDto> GetConfigAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        var org = await _db.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken);

        var schedule = NormalizeUrl(org?.SpiderSchedulePageUrl)
                       ?? ResolveScheduleFromAppSettings(organizationId);

        var hasDb = !string.IsNullOrWhiteSpace(org?.SpiderSchedulePageUrl);

        return BuildConfigDto(schedule, hasDb);
    }

    public async Task<ServiceResponse<SpiderConfigDto>> SaveConfigAsync(
        Guid organizationId,
        SaveSpiderConfigRequest request,
        CancellationToken cancellationToken = default)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken);
        if (org == null)
        {
            return new ServiceResponse<SpiderConfigDto>(
                false,
                null,
                new AppError(ErrorCodes.NotFound, "Organization not found."));
        }

        org.SpiderSchedulePageUrl = NormalizeUrl(request.SchedulePageUrl);
        await _db.SaveChangesAsync(cancellationToken);

        var schedule = org.SpiderSchedulePageUrl ?? ResolveScheduleFromAppSettings(organizationId);
        var hasDb = !string.IsNullOrWhiteSpace(org.SpiderSchedulePageUrl);

        return new ServiceResponse<SpiderConfigDto>(true, BuildConfigDto(schedule, hasDb));
    }

    public string? ResolveSchedulePageUrl(Guid organizationId, string? requestUrl = null)
    {
        var fromRequest = NormalizeUrl(requestUrl);
        if (!string.IsNullOrWhiteSpace(fromRequest))
            return fromRequest;

        var org = _db.Organizations.AsNoTracking().FirstOrDefault(o => o.Id == organizationId);
        var fromDb = NormalizeUrl(org?.SpiderSchedulePageUrl);
        if (!string.IsNullOrWhiteSpace(fromDb))
            return fromDb;

        return ResolveScheduleFromAppSettings(organizationId);
    }

    public string? ResolveNewsStartUrl(Guid organizationId, string? requestUrl = null)
    {
        var fromRequest = NormalizeUrl(requestUrl);
        if (!string.IsNullOrWhiteSpace(fromRequest))
            return fromRequest;

        var org = _db.Organizations.AsNoTracking().FirstOrDefault(o => o.Id == organizationId);
        return NormalizeUrl(org?.SpiderNewsStartUrl);
    }

    private string? ResolveScheduleFromAppSettings(Guid organizationId)
    {
        var perOrg = _configuration[$"Spider:Organizations:{organizationId}:SchedulePageUrl"];
        if (!string.IsNullOrWhiteSpace(perOrg))
            return perOrg.Trim();

        return NormalizeUrl(_configuration["Spider:DefaultSchedulePageUrl"]);
    }

    private static string? NormalizeUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;
        return url.Trim();
    }

    private static SpiderConfigDto BuildConfigDto(string? schedule, bool isSavedInDatabase) =>
        new()
        {
            SchedulePageUrl = schedule ?? string.Empty,
            HasSchedulePageUrl = !string.IsNullOrWhiteSpace(schedule),
            IsSavedInDatabase = isSavedInDatabase,
        };
}
