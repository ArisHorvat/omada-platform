using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Repositories;
using Omada.Api.Services;
using Omada.Api.Services.Interfaces;
using Omada.Api.Tests.Infrastructure;

namespace Omada.Api.Tests.Spider;

/// <summary>
/// Thesis verification: idempotent schedule sync — second run skips unchanged rows.
/// </summary>
public class ScheduleSpiderSyncServiceTests
{
    [Fact]
    public async Task SyncScheduleDatabaseAsync_IsIdempotent_ForIdenticalInput()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = TestDb.CreateContext(dbName, organizationId: null);
        var orgId = Guid.NewGuid();
        context.Organizations.Add(new Organization
        {
            Id = orgId,
            Name = "Spider Org",
            EmailDomain = "spider.local",
            InviteCode = "SPIDER",
        });
        await context.SaveChangesAsync();

        var events = new List<ScrapedEventDto>
        {
            new()
            {
                ClassName = "Algorithms",
                Time = "Monday 08:00-10:00",
                Room = "A101",
                Professor = "Dr. Smith",
                GroupNumber = "G1",
                ActivityType = "Curs",
            },
        };

        var extraction = new SiteScheduleExtractionResult
        {
            StartUrl = "http://uni.test/orar.html",
            Events = events,
            Pages = [],
            CrawledMultiplePages = false,
            HubLinksDiscovered = 0,
            SchedulePagesScraped = 1,
            WasTruncated = false,
        };

        var spider = new Mock<IWebSpiderService>();
        spider.Setup(s => s.ExtractScheduleFromSiteAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(extraction);

        var urlResolver = new Mock<ISpiderUrlResolver>();
        urlResolver.Setup(r => r.ResolveSchedulePageUrl(orgId, null)).Returns("http://uni.test/orar.html");

        var resolution = new Mock<IScrapedEntityResolutionService>();
        resolution.Setup(r => r.BuildMapsAsync(orgId, It.IsAny<IReadOnlyList<ScrapedEventDto>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ScrapedEventResolutionMaps());

        var uow = new UnitOfWork(context);
        var service = new ScheduleSpiderSyncService(
            uow,
            spider.Object,
            urlResolver.Object,
            resolution.Object,
            NullLogger<ScheduleSpiderSyncService>.Instance);

        var first = await service.SyncScheduleDatabaseAsync(orgId);
        var second = await service.SyncScheduleDatabaseAsync(orgId);

        Assert.Equal(1, first.Created);
        Assert.Equal(0, first.Skipped);
        Assert.Equal(0, second.Created);
        Assert.True(second.Skipped > 0);
        Assert.Equal(1, context.ScrapedClassEvents.Count(e => e.OrganizationId == orgId));
    }
}
