using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class NewsSpiderSyncService : INewsSpiderSyncService
{
    private const int MaxArticlesPerSync = 40;

    private readonly IUnitOfWork _uow;
    private readonly IWebSpiderService _spider;
    private readonly ISpiderUrlResolver _urlResolver;
    private readonly ILogger<NewsSpiderSyncService> _logger;

    public NewsSpiderSyncService(
        IUnitOfWork uow,
        IWebSpiderService spider,
        ISpiderUrlResolver urlResolver,
        ILogger<NewsSpiderSyncService> logger)
    {
        _uow = uow;
        _spider = spider;
        _urlResolver = urlResolver;
        _logger = logger;
    }

    public async Task<SpiderSyncStatsDto> SyncNewsDatabaseAsync(
        Guid organizationId,
        Guid? authorUserId,
        CancellationToken cancellationToken = default)
    {
        var stats = new SpiderSyncStatsDto();
        var newsStartUrl = _urlResolver.ResolveNewsStartUrl(organizationId, null);
        if (string.IsNullOrWhiteSpace(newsStartUrl))
        {
            _logger.LogWarning("No spider news URL configured for organization {OrganizationId}.", organizationId);
            return stats;
        }

        var authorId = await ResolveAuthorIdAsync(organizationId, authorUserId, cancellationToken);
        if (authorId == null)
        {
            _logger.LogWarning("No author user found for news sync in organization {OrganizationId}.", organizationId);
            return stats;
        }

        NewsDiscoveryResult discovery;
        try
        {
            discovery = await _spider.DiscoverNewsLinksAsync(newsStartUrl, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "News discovery failed for organization {OrganizationId}.", organizationId);
            throw;
        }

        var articleUrls = discovery.Pages
            .Where(p => p.Kind == NewsPageKind.Article && !string.IsNullOrWhiteSpace(p.Url))
            .Select(p => p.Url!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxArticlesPerSync)
            .ToList();

        if (articleUrls.Count == 0)
        {
            _logger.LogWarning("No article pages discovered for organization {OrganizationId}.", organizationId);
            return stats;
        }

        var existingByUrl = (await _uow.Repository<NewsItem>()
                .FindAsync(n => n.OrganizationId == organizationId && n.SourceUrl != null))
            .Where(n => !string.IsNullOrWhiteSpace(n.SourceUrl))
            .GroupBy(n => n.SourceUrl!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        foreach (var url in articleUrls)
        {
            cancellationToken.ThrowIfCancellationRequested();
            stats.Processed++;

            var html = await _spider.FetchSchedulePageHtmlAsync(url, cancellationToken);
            if (string.IsNullOrWhiteSpace(html))
            {
                stats.Skipped++;
                continue;
            }

            ExtractedNewsArticleDto article;
            try
            {
                article = await _spider.ExtractNewsArticleAsync(html, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to extract news article from {Url}.", url);
                stats.Skipped++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(article.Title) || string.IsNullOrWhiteSpace(article.Content))
            {
                stats.Skipped++;
                continue;
            }

            var title = Truncate(article.Title.Trim(), 150);
            var content = Truncate(article.Content.Trim(), 5000);
            var hash = ComputeContentHash(title, content);

            if (existingByUrl.TryGetValue(url, out var existing))
            {
                if (string.Equals(existing.SourceContentHash, hash, StringComparison.Ordinal))
                {
                    stats.Skipped++;
                    continue;
                }

                existing.Title = title;
                existing.Content = content;
                existing.Category = article.Category;
                existing.SourceContentHash = hash;
                existing.UpdatedAt = DateTime.UtcNow;
                _uow.Repository<NewsItem>().Update(existing);
                stats.Updated++;
            }
            else
            {
                var news = new NewsItem
                {
                    OrganizationId = organizationId,
                    AuthorId = authorId.Value,
                    Title = title,
                    Content = content,
                    Type = NewsType.Announcement,
                    Category = article.Category,
                    SourceUrl = url,
                    SourceContentHash = hash
                };
                await _uow.Repository<NewsItem>().AddAsync(news);
                existingByUrl[url] = news;
                stats.Created++;
            }
        }

        await _uow.CompleteAsync();
        return stats;
    }

    private async Task<Guid?> ResolveAuthorIdAsync(
        Guid organizationId,
        Guid? preferredUserId,
        CancellationToken cancellationToken)
    {
        if (preferredUserId.HasValue)
        {
            var member = await _uow.Repository<OrganizationMember>()
                .GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.OrganizationId == organizationId && m.UserId == preferredUserId.Value && m.IsActive,
                    cancellationToken);
            if (member != null)
                return preferredUserId.Value;
        }

        return await _uow.Repository<OrganizationMember>()
            .GetQueryable()
            .AsNoTracking()
            .Where(m => m.OrganizationId == organizationId && m.IsActive)
            .OrderBy(m => m.JoinedAt)
            .Select(m => (Guid?)m.UserId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static string ComputeContentHash(string title, string content)
    {
        var payload = $"{title}\n{content}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(bytes);
    }
}
