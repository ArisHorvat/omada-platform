using System.Net;
using System.Net.Http.Headers;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Services;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Tests.Spider;

/// <summary>
/// Thesis verification: spider page budget and hostname politeness.
/// </summary>
public class WebSpiderServiceTests
{
    [Fact]
    public async Task DiscoverLinksAsync_RespectsPageBudget()
    {
        const int totalPages = 300;
        var responses = BuildLinkedMenuPages("spider.test", totalPages);
        var handler = new RecordingHttpMessageHandler(request =>
        {
            var path = request.RequestUri!.AbsolutePath.Trim('/');
            var page = string.IsNullOrEmpty(path) ? 1 : int.Parse(path.Split('-')[^1], System.Globalization.CultureInfo.InvariantCulture);
            return HtmlResponse(responses[page]);
        });

        var client = CreateSpiderClient(handler);
        var service = new WebSpiderService(client, Mock.Of<IGeminiService>(), NullLogger<WebSpiderService>.Instance);

        var result = await service.DiscoverLinksAsync("http://spider.test/page-1");

        Assert.True(result.Pages.Count <= 250);
        Assert.Equal(250, handler.Requests.Count);
    }

    [Fact]
    public async Task DiscoverLinksAsync_SendsDeclaredUserAgent()
    {
        var handler = new RecordingHttpMessageHandler(_ => HtmlResponse("<html><body>menu</body></html>"));
        var client = CreateSpiderClient(handler);
        var service = new WebSpiderService(client, Mock.Of<IGeminiService>(), NullLogger<WebSpiderService>.Instance);

        await service.DiscoverLinksAsync("http://spider.test/start");

        var userAgent = handler.Requests.Single().Headers.UserAgent.ToString();
        Assert.Contains("OmadaPlatform/1.0", userAgent, StringComparison.Ordinal);
        Assert.Contains("WebSpider", userAgent, StringComparison.Ordinal);
    }

    [Fact]
    public async Task DiscoverLinksAsync_DoesNotFollowExternalHosts()
    {
        var html = """
            <html><body>
              <a href="/internal-next">internal</a>
              <a href="https://external.example.com/page">external</a>
            </body></html>
            """;

        var handler = new RecordingHttpMessageHandler(request =>
        {
            if (!string.Equals(request.RequestUri!.Host, "spider.test", StringComparison.OrdinalIgnoreCase))
                return new HttpResponseMessage(HttpStatusCode.NotFound);

            return HtmlResponse(html);
        });

        var client = CreateSpiderClient(handler);
        var service = new WebSpiderService(client, Mock.Of<IGeminiService>(), NullLogger<WebSpiderService>.Instance);

        var result = await service.DiscoverLinksAsync("http://spider.test/start");

        Assert.DoesNotContain(handler.Requests, r => r.RequestUri!.Host.Contains("external.example.com", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(result.Pages, p => p.Url.Contains("external.example.com", StringComparison.OrdinalIgnoreCase));
    }

    private static HttpClient CreateSpiderClient(HttpMessageHandler handler)
    {
        var client = new HttpClient(handler);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("OmadaPlatform/1.0 (WebSpider; +https://omada.local)");
        return client;
    }

    private static Dictionary<int, string> BuildLinkedMenuPages(string host, int count)
    {
        var pages = new Dictionary<int, string>();
        for (var i = 1; i <= count; i++)
        {
            var next = i < count ? $"http://{host}/page-{i + 1}" : string.Empty;
            var link = string.IsNullOrEmpty(next) ? string.Empty : $"""<a href="{next}">next</a>""";
            pages[i] = $"<html><body>{link}</body></html>";
        }

        return pages;
    }

    private static HttpResponseMessage HtmlResponse(string html) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(html, System.Text.Encoding.UTF8, "text/html"),
        };

    private sealed class RecordingHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public RecordingHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) => _handler = handler;

        public List<HttpRequestMessage> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            return Task.FromResult(_handler(request));
        }
    }
}
