using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using HtmlAgilityPack;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Scraping;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class WebSpiderService : IWebSpiderService
{
    private readonly HttpClient _http;
    private readonly IGeminiService _gemini;
    private readonly ILogger<WebSpiderService> _logger;

    /// <summary>Upper bound so crawls cannot run unbounded.</summary>
    private const int MaxPagesToVisit = 250;

    private const int MaxNewsPagesToVisit = 200;

    private static readonly Regex NewsPathSegment = new(
        @"(/|^)(news|blog|noutati|stiri|articole?|anunt|announcements?|press|magazine|media|post|posts)(/|$)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex DateArchivePath = new(
        @"/\d{4}/\d{2}(/|$)",
        RegexOptions.Compiled);

    private static readonly Regex SlugOrIdPath = new(
        @"/[^/]+-\d{2,}(/|$)|/\d{5,}(/|$)",
        RegexOptions.Compiled);

    private static readonly string[] ScheduleHeaderKeywords =
    [
        "time", "ora", "orele", "orar", "interval", "hour", "ziua",
        "room", "sala", "classroom", "cabinet",
        "course", "curs", "class", "disciplina", "materie", "subject",
        "professor", "prof", "teacher", "titular", "cadru",
        "group", "grup", "grupa", "serie", "formatia", "formatie"
    ];

    /// <summary>Minimum timetable header signals (avoids treating program index tables as schedules).</summary>
    private static readonly string[] StrongScheduleHeaderSignals =
    [
        "orele", "disciplina", "formatia", "formatie", "ziua", "cadrul didactic"
    ];

    public WebSpiderService(HttpClient http, IGeminiService gemini, ILogger<WebSpiderService> logger)
    {
        _http = http;
        _gemini = gemini;
        _logger = logger;
    }

    public async Task<SpiderDiscoveryResult> DiscoverLinksAsync(string startUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(startUrl))
            throw new ArgumentException("Start URL is required.", nameof(startUrl));

        if (!Uri.TryCreate(startUrl, UriKind.Absolute, out var startUri))
            throw new ArgumentException("Start URL must be absolute.", nameof(startUrl));

        var allowedHost = startUri.Host;
        var queue = new Queue<string>();
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var pages = new List<DiscoveredPageDto>();

        queue.Enqueue(NormalizeUrl(startUri));

        while (queue.Count > 0 && visited.Count < MaxPagesToVisit)
        {
            var url = queue.Dequeue();
            if (!visited.Add(url))
                continue;

            var html = await FetchHtmlAsync(url, cancellationToken);
            if (html == null)
                continue;

            var kind = ClassifyPage(html);
            pages.Add(new DiscoveredPageDto { Url = url, Kind = kind });

            // Expand links from menu-like pages (and unknown) to discover schedule leaves; skip expanding from schedule tables to reduce noise.
            if (kind == SpiderPageKind.Schedule)
                continue;

            var baseUri = new Uri(url);
            foreach (var next in ExtractSameDomainHrefs(html, baseUri, allowedHost))
            {
                if (!visited.Contains(next))
                    queue.Enqueue(next);
            }
        }

        return new SpiderDiscoveryResult
        {
            StartUrl = startUrl,
            Pages = pages
        };
    }

    public async Task<NewsDiscoveryResult> DiscoverNewsLinksAsync(string startUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(startUrl))
            throw new ArgumentException("Start URL is required.", nameof(startUrl));

        if (!Uri.TryCreate(startUrl, UriKind.Absolute, out var startUri))
            throw new ArgumentException("Start URL must be absolute.", nameof(startUrl));

        var allowedHost = startUri.Host;
        var queue = new Queue<string>();
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var pages = new List<DiscoveredNewsPageDto>();

        queue.Enqueue(NormalizeUrl(startUri));

        while (queue.Count > 0 && visited.Count < MaxNewsPagesToVisit)
        {
            var url = queue.Dequeue();
            if (!visited.Add(url))
                continue;

            var html = await FetchHtmlAsync(url, cancellationToken);
            if (html == null)
                continue;

            var kind = ClassifyNewsPage(html, url);
            pages.Add(new DiscoveredNewsPageDto { Url = url, Kind = kind });

            if (kind == NewsPageKind.Article)
                continue;

            var baseUri = new Uri(url);
            foreach (var next in ExtractNewsRelatedHrefs(html, baseUri, allowedHost))
            {
                if (!visited.Contains(next))
                    queue.Enqueue(next);
            }
        }

        return new NewsDiscoveryResult
        {
            StartUrl = startUrl,
            Pages = pages
        };
    }

    public async Task<ExtractedNewsArticleDto> ExtractNewsArticleAsync(string html, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(html))
            return new ExtractedNewsArticleDto();

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var title = ExtractArticleTitle(doc);
        var working = new HtmlDocument();
        working.LoadHtml(html);
        StripNoiseForArticle(working);

        var content = ExtractPrimaryArticleText(working);
        content = NormalizeWhitespace(content);

        if (string.IsNullOrWhiteSpace(title))
            title = ExtractArticleTitle(working);

        title = title.Trim();
        content = content.Trim();

        var category = NewsCategory.General;
        var excerpt = $"{title}\n\n{content}".Trim();
        if (excerpt.Length > 0)
        {
            try
            {
                category = await _gemini.CategorizeNewsExcerptAsync(excerpt, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini news triage failed; using category General.");
                category = NewsCategory.General;
            }
        }

        return new ExtractedNewsArticleDto
        {
            Title = title,
            Content = content,
            Category = category
        };
    }

    private async Task<string?> FetchHtmlAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return null;

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
            if (!contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase) &&
                !contentType.Contains("application/xhtml", StringComparison.OrdinalIgnoreCase))
                return null;

            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    /// <inheritdoc />
    public Task<string?> FetchSchedulePageHtmlAsync(string url, CancellationToken cancellationToken = default) =>
        FetchHtmlAsync(url, cancellationToken);

    public async Task<IReadOnlyList<ScrapedEventDto>> ExtractScheduleFromTableAsync(string html, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(html))
            return Array.Empty<ScrapedEventDto>();

        try
        {
            return ExtractScheduleFromHtmlCore(html);
        }
        catch (HtmlStructureChangedException ex)
        {
            _logger.LogWarning(ex,
                "Primary HtmlAgilityPack schedule table parser did not produce usable rows (missing table, empty grid, or structure drift).");

            _logger.LogWarning(
                "GEMINI AI FALLBACK TRIGGERED: schedule page HTML no longer matches the expected <table>-based layout or yielded zero class rows. " +
                "Attempting generative JSON extraction from stripped plain text. Verify the source site markup if this happens often.");

            var plainText = StripHtmlToPlainText(html);
            return await _gemini.ExtractScheduleFromRawTextAsync(plainText, cancellationToken);
        }
    }

    public async Task<SiteScheduleExtractionResult> ExtractScheduleFromSiteAsync(
        string startUrl,
        int maxSchedulePages = 64,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(startUrl))
            throw new ArgumentException("Start URL is required.", nameof(startUrl));

        if (!Uri.TryCreate(startUrl, UriKind.Absolute, out var startUri))
            throw new ArgumentException("Start URL must be absolute.", nameof(startUrl));

        var allowedHost = startUri.Host;
        var hubDirectory = GetDirectoryPrefix(startUri);
        var queue = new Queue<string>();
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var pageSummaries = new List<ScrapedSchedulePageSummaryDto>();
        var allEvents = new List<ScrapedEventDto>();
        var hubLinksDiscovered = 0;
        var schedulePagesScraped = 0;
        const int maxHttpFetches = 120;

        var startNormalized = NormalizeUrl(startUri);
        var startHtml = await FetchHtmlAsync(startNormalized, cancellationToken);
        if (startHtml != null)
        {
            visited.Add(startNormalized);
            var startKind = ClassifyPage(startHtml);
            List<ScrapedEventDto> startEvents;
            try
            {
                startEvents = ExtractScheduleFromHtmlCore(startHtml, startNormalized);
            }
            catch (HtmlStructureChangedException)
            {
                startEvents = new List<ScrapedEventDto>();
            }

            if (startEvents.Count > 0)
            {
                allEvents.AddRange(startEvents);
                schedulePagesScraped++;
                pageSummaries.Add(new ScrapedSchedulePageSummaryDto
                {
                    SourceUrl = startNormalized,
                    EventCount = startEvents.Count,
                    PageKind = SpiderPageKind.Schedule,
                });
            }
            else
            {
                pageSummaries.Add(new ScrapedSchedulePageSummaryDto
                {
                    SourceUrl = startNormalized,
                    EventCount = 0,
                    PageKind = startKind,
                });

                var hubLinks = ExtractScheduleHubHrefs(startHtml, new Uri(startNormalized), allowedHost, hubDirectory)
                    .OrderBy(u => u, StringComparer.OrdinalIgnoreCase)
                    .ToList();
                hubLinksDiscovered = hubLinks.Count;
                foreach (var link in hubLinks)
                {
                    if (!visited.Contains(link))
                        queue.Enqueue(link);
                }
            }
        }

        var httpFetches = visited.Count;

        while (queue.Count > 0 && schedulePagesScraped < maxSchedulePages && httpFetches < maxHttpFetches)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var url = queue.Dequeue();
            if (!visited.Add(url))
                continue;

            httpFetches++;
            var html = await FetchHtmlAsync(url, cancellationToken);
            if (html == null)
                continue;

            var kind = ClassifyPage(html);
            List<ScrapedEventDto> pageEvents;
            try
            {
                pageEvents = ExtractScheduleFromHtmlCore(html, url);
            }
            catch (HtmlStructureChangedException)
            {
                pageEvents = new List<ScrapedEventDto>();
            }

            if (pageEvents.Count > 0)
            {
                allEvents.AddRange(pageEvents);
                schedulePagesScraped++;
                pageSummaries.Add(new ScrapedSchedulePageSummaryDto
                {
                    SourceUrl = url,
                    EventCount = pageEvents.Count,
                    PageKind = SpiderPageKind.Schedule,
                });
                continue;
            }

            pageSummaries.Add(new ScrapedSchedulePageSummaryDto
            {
                SourceUrl = url,
                EventCount = 0,
                PageKind = kind,
            });

            if (kind == SpiderPageKind.Schedule)
                continue;

            var baseUri = new Uri(url);
            foreach (var next in ExtractScheduleHubHrefs(html, baseUri, allowedHost, hubDirectory))
            {
                if (!visited.Contains(next))
                    queue.Enqueue(next);
            }
        }

        var wasTruncated = queue.Count > 0 || schedulePagesScraped >= maxSchedulePages;

        return new SiteScheduleExtractionResult
        {
            StartUrl = startUrl,
            Events = ScrapedScheduleDedup.RemoveExactDuplicates(allEvents),
            Pages = pageSummaries,
            CrawledMultiplePages = schedulePagesScraped > 1
                || (hubLinksDiscovered > 0 && schedulePagesScraped > 0),
            HubLinksDiscovered = hubLinksDiscovered,
            SchedulePagesScraped = schedulePagesScraped,
            WasTruncated = wasTruncated,
        };
    }

    /// <summary>HtmlAgilityPack-only extraction from all timetable tables on one page.</summary>
    private static List<ScrapedEventDto> ExtractScheduleFromHtmlCore(string html, string? sourcePageUrl = null)
    {
        try
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(html);
            var results = new List<ScrapedEventDto>();
            var pageCourseHint = ExtractSchedulePageTitle(doc);

            foreach (var table in SelectLeafScheduleTables(doc))
            {
                var groupHint = InferGroupLabelBeforeTable(table);
                var courseHint = InferPageCourseTitleBeforeTable(table) ?? pageCourseHint;
                results.AddRange(ExtractRowsFromScheduleTable(table, groupHint, sourcePageUrl, courseHint));
            }

            if (results.Count == 0)
                throw new HtmlStructureChangedException("No schedule-like tables with class rows were found on the page.");

            return ScrapedScheduleDedup.RemoveExactDuplicates(results);
        }
        catch (HtmlStructureChangedException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new HtmlStructureChangedException("HtmlAgilityPack table schedule extraction failed unexpectedly.", ex);
        }
    }

    private static List<ScrapedEventDto> ExtractRowsFromScheduleTable(
        HtmlNode table,
        string? groupHint,
        string? sourcePageUrl = null,
        string? courseHint = null)
    {
        var grid = ParseTableIntoGrid(table);
        if (grid.Count == 0)
            return new List<ScrapedEventDto>();

        var headerRowIndex = FindHeaderRowIndex(grid);
        if (headerRowIndex < 0)
            headerRowIndex = 0;

        var columnMap = MapColumnsFromHeaderRow(grid[headerRowIndex]);
        var results = new List<ScrapedEventDto>();

        for (var r = headerRowIndex + 1; r < grid.Count; r++)
        {
            var row = grid[r];
            if (row.All(string.IsNullOrWhiteSpace))
                continue;

            var day = GetCell(row, columnMap.Day);
            var hours = GetCell(row, columnMap.Time);
            var frequency = GetCell(row, columnMap.Frequency);
            var time = string.Join(" ",
                new[] { day, hours, frequency }.Where(s => !string.IsNullOrWhiteSpace(s)));

            var className = GetCell(row, columnMap.ClassName);
            var activityType = NormalizeActivityType(GetCell(row, columnMap.ActivityType));

            var group = GetCell(row, columnMap.Group);
            if (string.IsNullOrWhiteSpace(group) && !string.IsNullOrWhiteSpace(groupHint))
                group = groupHint;

            var dto = new ScrapedEventDto
            {
                Time = time,
                DayLabel = string.IsNullOrWhiteSpace(day) ? null : day.Trim(),
                HoursLabel = string.IsNullOrWhiteSpace(hours) ? null : hours.Trim(),
                FrequencyLabel = string.IsNullOrWhiteSpace(frequency) ? null : frequency.Trim(),
                ClassName = className,
                Room = GetCell(row, columnMap.Room),
                Professor = GetCell(row, columnMap.Professor),
                GroupNumber = group,
                ActivityType = activityType,
                SourcePageUrl = sourcePageUrl,
            };

            if (string.IsNullOrWhiteSpace(dto.ClassName) && string.IsNullOrWhiteSpace(dto.Time))
                continue;

            ScrapedScheduleRowEnricher.EnrichRow(dto, courseHint);
            results.Add(dto);
        }

        return results;
    }

    private static string? ExtractSchedulePageTitle(HtmlDocument doc)
    {
        var titleNode = doc.DocumentNode.SelectSingleNode("//title");
        if (titleNode == null)
            return null;

        var raw = HtmlEntity.DeEntitize(titleNode.InnerText ?? "").Trim();
        return ScrapedScheduleRowEnricher.ParseSchedulePageTitle(raw);
    }

    /// <summary>Course / discipline title above the table (not a Grupa heading).</summary>
    private static string? InferPageCourseTitleBeforeTable(HtmlNode table)
    {
        for (var node = table.PreviousSibling; node != null; node = node.PreviousSibling)
        {
            if (node.NodeType != HtmlNodeType.Element)
                continue;

            var fromHeading = ReadCourseHeading(node);
            if (!string.IsNullOrWhiteSpace(fromHeading))
                return fromHeading;
        }

        var parent = table.ParentNode;
        while (parent != null && parent.Name is not "html" and not "body" and not "#document")
        {
            for (var sibling = parent.PreviousSibling; sibling != null; sibling = sibling.PreviousSibling)
            {
                if (sibling.NodeType != HtmlNodeType.Element)
                    continue;
                var fromHeading = ReadCourseHeading(sibling);
                if (!string.IsNullOrWhiteSpace(fromHeading))
                    return fromHeading;
            }

            parent = parent.ParentNode;
        }

        return null;
    }

    private static string? ReadCourseHeading(HtmlNode node)
    {
        if (node.Name is "h1" or "h2" or "h3" or "h4")
        {
            var text = HtmlEntity.DeEntitize(node.InnerText ?? "").Trim();
            var fromOrar = ScrapedScheduleRowEnricher.ParseSchedulePageTitle(text);
            if (!string.IsNullOrWhiteSpace(fromOrar))
                return fromOrar;
            if (IsCourseHeading(text))
                return text;
        }

        var nested = node.SelectSingleNode(".//h1|.//h2|.//h3|.//h4");
        if (nested == null)
            return null;

        var nestedText = HtmlEntity.DeEntitize(nested.InnerText ?? "").Trim();
        var nestedOrar = ScrapedScheduleRowEnricher.ParseSchedulePageTitle(nestedText);
        if (!string.IsNullOrWhiteSpace(nestedOrar))
            return nestedOrar;

        return IsCourseHeading(nestedText) ? nestedText : null;
    }

    private static bool IsCourseHeading(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        var lower = text.ToLowerInvariant();
        if (lower.Contains("grupa") || lower.Contains("tabelar"))
            return false;

        if (lower.StartsWith("orar"))
            return false;

        if (System.Text.RegularExpressions.Regex.IsMatch(text, @"^I?\d+$"))
            return false;

        if (ScrapedScheduleRowEnricher.IsProgramOrGroupPageCode(text))
            return false;

        return text.Length >= 3;
    }

    private static string? InferGroupLabelBeforeTable(HtmlNode table)
    {
        var heading = FindNearestGroupHeadingBefore(table);
        return string.IsNullOrWhiteSpace(heading) ? null : heading;
    }

    private static string? FindNearestGroupHeadingBefore(HtmlNode node)
    {
        for (var sibling = node.PreviousSibling; sibling != null; sibling = sibling.PreviousSibling)
        {
            if (sibling.NodeType != HtmlNodeType.Element)
                continue;

            if (sibling.Name is "h1" or "h2" or "h3" or "h4")
            {
                var text = HtmlEntity.DeEntitize(sibling.InnerText ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(text) && text.Contains("grupa", StringComparison.OrdinalIgnoreCase))
                    return text;
            }

            var nestedHeading = sibling.SelectSingleNode(".//h1|.//h2|.//h3|.//h4");
            if (nestedHeading != null)
            {
                var text = HtmlEntity.DeEntitize(nestedHeading.InnerText ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(text) && text.Contains("grupa", StringComparison.OrdinalIgnoreCase))
                    return text;
            }
        }

        var parent = node.ParentNode;
        if (parent == null || parent.Name is "html" or "body" or "#document")
            return null;

        return FindNearestGroupHeadingBefore(parent);
    }

    /// <summary>
    /// Prefer inner timetable tables so wrapper/layout tables are not parsed again (avoids duplicate rows).
    /// </summary>
    private static IEnumerable<HtmlNode> SelectLeafScheduleTables(HtmlDocument doc)
    {
        var candidates = (doc.DocumentNode.SelectNodes("//table") ?? Enumerable.Empty<HtmlNode>())
            .Where(TableLooksLikeSchedule)
            .ToList();

        if (candidates.Count == 0)
            return candidates;

        var leaf = candidates
            .Where(t => !HasNestedScheduleTable(t))
            .Where(t => !HasScheduleTableAncestor(t))
            .ToList();

        return leaf.Count > 0 ? leaf : candidates;
    }

    private static bool HasNestedScheduleTable(HtmlNode table) =>
        table.SelectNodes(".//table")?.Any(n => !ReferenceEquals(n, table) && TableLooksLikeSchedule(n)) == true;

    private static bool HasScheduleTableAncestor(HtmlNode table)
    {
        for (var parent = table.ParentNode; parent != null; parent = parent.ParentNode)
        {
            if (parent.NodeType != HtmlNodeType.Element)
                continue;

            if (parent.Name.Equals("table", StringComparison.OrdinalIgnoreCase) && TableLooksLikeSchedule(parent))
                return true;
        }

        return false;
    }

    private static IEnumerable<string> ExtractScheduleHubHrefs(
        string html,
        Uri pageUri,
        string allowedHost,
        string? directoryPrefix)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var a in doc.DocumentNode.SelectNodes("//a[@href]") ?? Enumerable.Empty<HtmlNode>())
        {
            var href = a.GetAttributeValue("href", string.Empty);
            if (string.IsNullOrWhiteSpace(href))
                continue;

            if (href.StartsWith('#') || href.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase)
                || href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                continue;

            if (!Uri.TryCreate(pageUri, href, out var absolute))
                continue;

            if (!string.Equals(absolute.Host, allowedHost, StringComparison.OrdinalIgnoreCase))
                continue;

            if (absolute.Scheme != Uri.UriSchemeHttp && absolute.Scheme != Uri.UriSchemeHttps)
                continue;

            if (!absolute.AbsolutePath.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
                continue;

            if (!string.IsNullOrWhiteSpace(directoryPrefix)
                && !absolute.AbsolutePath.StartsWith(directoryPrefix, StringComparison.OrdinalIgnoreCase))
                continue;

            var fileName = Path.GetFileName(absolute.LocalPath);
            if (fileName.Equals("index.html", StringComparison.OrdinalIgnoreCase))
                continue;

            var normalized = NormalizeUrl(absolute);
            if (seen.Add(normalized))
                yield return normalized;
        }
    }

    private static string? GetDirectoryPrefix(Uri uri)
    {
        var path = uri.AbsolutePath;
        if (!path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            return path.TrimEnd('/');

        var dir = Path.GetDirectoryName(path)?.Replace('\\', '/') ?? "/";
        return dir.EndsWith('/') ? dir : dir + "/";
    }

    private static string StripHtmlToPlainText(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);
        var inner = doc.DocumentNode.InnerText ?? string.Empty;
        return NormalizeWhitespace(inner);
    }

    private static NewsPageKind ClassifyNewsPage(string html, string pageUrl)
    {
        if (string.IsNullOrWhiteSpace(html))
            return NewsPageKind.Unknown;

        if (!Uri.TryCreate(pageUrl, UriKind.Absolute, out var uri))
            return NewsPageKind.Unknown;

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var articles = doc.DocumentNode.SelectNodes("//article");
        var articleCount = articles?.Count ?? 0;

        if (articleCount >= 2)
            return NewsPageKind.Archive;

        if (articleCount == 1)
        {
            var textLen = (articles![0].InnerText ?? "").Length;
            if (textLen >= 600)
                return NewsPageKind.Article;
        }

        if (articleCount == 0)
        {
            var listingHints =
                (doc.DocumentNode.SelectNodes("//*[contains(@class,'archive') or contains(@class,'listing') or contains(@class,'category')]")?.Count ?? 0) > 0
                || (doc.DocumentNode.SelectNodes("//ul[contains(@class,'posts')]//li|//div[contains(@class,'grid')]//a")?.Count ?? 0) >= 6;

            if (listingHints)
                return NewsPageKind.Archive;

            var main = doc.DocumentNode.SelectSingleNode("//main");
            if (main != null && main.InnerText.Length >= 900 && IsNewsRelatedUrl(uri))
                return NewsPageKind.Article;
        }

        if (IsNewsRelatedUrl(uri) && SlugOrIdPath.IsMatch(uri.AbsolutePath))
            return NewsPageKind.Article;

        if (IsNewsRelatedUrl(uri) && DateArchivePath.IsMatch(uri.AbsolutePath))
            return NewsPageKind.Archive;

        return NewsPageKind.Unknown;
    }

    private IEnumerable<string> ExtractNewsRelatedHrefs(string html, Uri pageUri, string allowedHost)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var a in doc.DocumentNode.SelectNodes("//a[@href]") ?? Enumerable.Empty<HtmlNode>())
        {
            var href = a.GetAttributeValue("href", string.Empty);
            if (string.IsNullOrWhiteSpace(href))
                continue;

            if (href.StartsWith('#') || href.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase) ||
                href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                continue;

            if (!Uri.TryCreate(pageUri, href, out var absolute))
                continue;

            if (!string.Equals(absolute.Host, allowedHost, StringComparison.OrdinalIgnoreCase))
                continue;

            if (absolute.Scheme != Uri.UriSchemeHttp && absolute.Scheme != Uri.UriSchemeHttps)
                continue;

            if (!IsNewsRelatedUrl(absolute) && !LooksLikeArticleUrl(absolute))
                continue;

            var normalized = NormalizeUrl(absolute);
            if (seen.Add(normalized))
                yield return normalized;
        }
    }

    private static bool IsNewsRelatedUrl(Uri uri)
    {
        var path = uri.AbsolutePath.ToLowerInvariant();
        if (NewsPathSegment.IsMatch(path))
            return true;
        if (DateArchivePath.IsMatch(path))
            return true;
        if (SlugOrIdPath.IsMatch(path))
            return true;
        return false;
    }

    private static bool LooksLikeArticleUrl(Uri uri)
    {
        var path = uri.AbsolutePath.Trim('/');
        if (path.Length < 8)
            return false;

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length >= 2)
        {
            var last = segments[^1];
            if (last.Length > 12 && last.Contains('-', StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static string ExtractArticleTitle(HtmlDocument doc)
    {
        var og = doc.DocumentNode.SelectSingleNode("//meta[@property='og:title']")
                 ?? doc.DocumentNode.SelectSingleNode("//meta[@name='twitter:title']");
        if (og != null)
        {
            var c = og.GetAttributeValue("content", "");
            if (!string.IsNullOrWhiteSpace(c))
                return HtmlEntity.DeEntitize(c).Trim();
        }

        var h1 = doc.DocumentNode.SelectSingleNode("//article//h1") ?? doc.DocumentNode.SelectSingleNode("//main//h1");
        if (h1 != null)
        {
            var t = HtmlEntity.DeEntitize(h1.InnerText ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(t))
                return t;
        }

        var title = doc.DocumentNode.SelectSingleNode("//title");
        if (title != null)
        {
            var t = HtmlEntity.DeEntitize(title.InnerText ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(t))
                return t;
        }

        return string.Empty;
    }

    private static void StripNoiseForArticle(HtmlDocument doc)
    {
        var removeTags = new[]
        {
            "script", "style", "nav", "header", "footer", "aside", "iframe", "noscript", "svg", "template",
            "form", "button", "object", "embed", "picture", "source"
        };

        foreach (var tag in removeTags)
        {
            foreach (var n in doc.DocumentNode.SelectNodes($"//{tag}")?.ToList() ?? Enumerable.Empty<HtmlNode>())
                n.Remove();
        }

        foreach (var n in doc.DocumentNode.SelectNodes("//*[@role='navigation' or @role='banner' or @role='contentinfo']")?.ToList() ??
                          Enumerable.Empty<HtmlNode>())
        {
            n.Remove();
        }

        foreach (var n in doc.DocumentNode.SelectNodes("//*[@class]")?.ToList() ?? Enumerable.Empty<HtmlNode>())
        {
            var cls = (n.GetAttributeValue("class", "") + " " + n.GetAttributeValue("id", "")).ToLowerInvariant();
            if (cls.Contains("sidebar", StringComparison.Ordinal) ||
                cls.Contains("widget", StringComparison.Ordinal) ||
                cls.Contains("advert", StringComparison.Ordinal) ||
                cls.Contains("cookie", StringComparison.Ordinal) ||
                cls.Contains("social-share", StringComparison.Ordinal) ||
                cls.Contains("comments", StringComparison.Ordinal) ||
                cls.Contains("related", StringComparison.Ordinal) ||
                cls.Contains("newsletter", StringComparison.Ordinal))
            {
                n.Remove();
            }
        }
    }

    private static string ExtractPrimaryArticleText(HtmlDocument doc)
    {
        HtmlNode? body =
            doc.DocumentNode.SelectSingleNode("//article//div[contains(@class,'content')]") ??
            doc.DocumentNode.SelectSingleNode("//article") ??
            doc.DocumentNode.SelectSingleNode("//main") ??
            doc.DocumentNode.SelectSingleNode("//*[@role='main']");

        if (body == null)
        {
            foreach (var cls in new[] { "post-content", "entry-content", "article-body", "article-content", "news-content", "news-body", "article__body" })
            {
                body = doc.DocumentNode.SelectSingleNode($"//*[contains(@class,'{cls}')]");
                if (body != null)
                    break;
            }
        }

        body ??= doc.DocumentNode.SelectSingleNode("//body");

        if (body == null)
            return string.Empty;

        foreach (var junk in body.SelectNodes(".//figure | .//figcaption | .//table")?.ToList() ?? Enumerable.Empty<HtmlNode>())
            junk.Remove();

        return HtmlEntity.DeEntitize(body.InnerText ?? "");
    }

    private static string NormalizeWhitespace(string text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        var sb = new StringBuilder(text.Length);
        var prevSpace = false;
        foreach (var ch in text)
        {
            if (char.IsWhiteSpace(ch))
            {
                if (!prevSpace)
                {
                    sb.Append(' ');
                    prevSpace = true;
                }
            }
            else
            {
                sb.Append(ch);
                prevSpace = false;
            }
        }

        return sb.ToString();
    }

    private static SpiderPageKind ClassifyPage(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return SpiderPageKind.Unknown;

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        foreach (var table in doc.DocumentNode.SelectNodes("//table") ?? Enumerable.Empty<HtmlNode>())
        {
            if (TableLooksLikeSchedule(table))
                return SpiderPageKind.Schedule;
        }

        return SpiderPageKind.Menu;
    }

    private static bool TableLooksLikeSchedule(HtmlNode table)
    {
        var rows = table.SelectNodes(".//tr");
        if (rows == null)
            return false;

        foreach (var tr in rows.Take(4))
        {
            var cells = tr.SelectNodes("./th|./td");
            if (cells == null || cells.Count < 4)
                continue;

            var joined = string.Join(" ", cells.Select(c => c.InnerText)).ToLowerInvariant();
            var strongHits = StrongScheduleHeaderSignals.Count(k => joined.Contains(k, StringComparison.Ordinal));
            if (strongHits >= 2)
                return true;

            var matches = ScheduleHeaderKeywords.Count(k => joined.Contains(k, StringComparison.Ordinal));
            if (matches >= 3 && joined.Contains("disciplina", StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private IEnumerable<string> ExtractSameDomainHrefs(string html, Uri pageUri, string allowedHost)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var a in doc.DocumentNode.SelectNodes("//a[@href]") ?? Enumerable.Empty<HtmlNode>())
        {
            var href = a.GetAttributeValue("href", string.Empty);
            if (string.IsNullOrWhiteSpace(href))
                continue;

            if (href.StartsWith('#') || href.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase) ||
                href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                continue;

            if (!Uri.TryCreate(pageUri, href, out var absolute))
                continue;

            if (!string.Equals(absolute.Host, allowedHost, StringComparison.OrdinalIgnoreCase))
                continue;

            if (absolute.Scheme != Uri.UriSchemeHttp && absolute.Scheme != Uri.UriSchemeHttps)
                continue;

            var normalized = NormalizeUrl(absolute);
            if (seen.Add(normalized))
                yield return normalized;
        }
    }

    private static string NormalizeUrl(Uri uri)
    {
        var builder = new UriBuilder(uri)
        {
            Fragment = null
        };
        if (builder.Path.EndsWith('/') && builder.Path.Length > 1)
            builder.Path = builder.Path.TrimEnd('/');
        return builder.Uri.AbsoluteUri;
    }

    /// <summary>
    /// Builds a logical row/column grid from &lt;tr&gt;/&lt;td|th&gt; including rowspan and colspan.
    /// </summary>
    private static List<List<string>> ParseTableIntoGrid(HtmlNode table)
    {
        var trNodes = table.SelectNodes(".//tr");
        if (trNodes == null || trNodes.Count == 0)
            return new List<List<string>>();

        var rowCount = trNodes.Count;
        var colCount = EstimateColumnCount(trNodes);
        if (colCount == 0)
            return new List<List<string>>();

        var grid = new string[rowCount, colCount];
        var occupied = new bool[rowCount, colCount];

        for (var r = 0; r < rowCount; r++)
            for (var c = 0; c < colCount; c++)
                grid[r, c] = string.Empty;

        for (var r = 0; r < rowCount; r++)
        {
            var cells = trNodes[r].SelectNodes("./th|./td");
            if (cells == null)
                continue;

            var c = 0;
            foreach (HtmlNode cell in cells)
            {
                while (c < colCount && occupied[r, c])
                    c++;

                if (c >= colCount)
                    break;

                var rs = Math.Max(1, ParseSpan(cell, "rowspan"));
                var cs = Math.Max(1, ParseSpan(cell, "colspan"));
                var text = HtmlEntity.DeEntitize(cell.InnerText ?? "").Trim();

                for (var dr = 0; dr < rs; dr++)
                {
                    for (var dc = 0; dc < cs; dc++)
                    {
                        var rr = r + dr;
                        var cc = c + dc;
                        if (rr >= rowCount || cc >= colCount)
                            continue;

                        occupied[rr, cc] = true;
                        if (dr == 0 && dc == 0)
                            grid[rr, cc] = text;
                    }
                }

                c += cs;
            }
        }

        var list = new List<List<string>>(rowCount);
        for (var r = 0; r < rowCount; r++)
        {
            var row = new List<string>(colCount);
            for (var c = 0; c < colCount; c++)
                row.Add(grid[r, c] ?? string.Empty);
            list.Add(row);
        }

        return list;
    }

    private static int EstimateColumnCount(HtmlNodeCollection trNodes)
    {
        var max = 0;
        foreach (HtmlNode tr in trNodes)
        {
            var cells = tr.SelectNodes("./th|./td");
            if (cells == null)
                continue;

            var sum = 0;
            foreach (HtmlNode cell in cells)
                sum += Math.Max(1, ParseSpan(cell, "colspan"));
            max = Math.Max(max, sum);
        }

        return max;
    }

    private static int ParseSpan(HtmlNode cell, string name)
    {
        var v = cell.GetAttributeValue(name, "1");
        return int.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : 1;
    }

    private static int FindHeaderRowIndex(List<List<string>> grid)
    {
        for (var i = 0; i < grid.Count; i++)
        {
            var joined = string.Join(" ", grid[i]).ToLowerInvariant();
            var hits = ScheduleHeaderKeywords.Count(k => joined.Contains(k, StringComparison.Ordinal));
            if (hits >= 2)
                return i;
        }

        return grid.Count > 0 ? 0 : -1;
    }

    private sealed class ColumnMap
    {
        public int Day = -1;
        public int Time = -1;
        public int Frequency = -1;
        public int ClassName = -1;
        public int Room = -1;
        public int Professor = -1;
        public int Group = -1;
        public int ActivityType = -1;
    }

    private static ColumnMap MapColumnsFromHeaderRow(IReadOnlyList<string> headerCells)
    {
        var map = new ColumnMap();
        for (var i = 0; i < headerCells.Count; i++)
        {
            var h = headerCells[i].ToLowerInvariant();
            if (map.Day < 0 && MatchesAny(h, "ziua", "zi ", "day"))
                map.Day = i;
            if (map.Time < 0 && (MatchesAny(h, "orele", "time", "interval", "hour") || h is "ora" or "ore"))
                map.Time = i;
            if (map.Frequency < 0 && MatchesAny(h, "frecventa", "frecven", "frequency", "sapt"))
                map.Frequency = i;
            if (map.ClassName < 0 && MatchesAny(h, "curs", "disciplina", "materie", "class", "course", "subject", "denumire"))
                map.ClassName = i;
            if (map.Room < 0 && MatchesAny(h, "room", "sala", "cabinet", "classroom"))
                map.Room = i;
            if (map.Professor < 0 && MatchesAny(h, "prof", "teacher", "titular", "cadru", "didactic"))
                map.Professor = i;
            if (map.Group < 0 && MatchesAny(h, "group", "grup", "grupa", "serie", "formatia", "formatie"))
                map.Group = i;
            if (map.ActivityType < 0 && MatchesAny(h, "tipul", "tip ", "type", "activitate"))
                map.ActivityType = i;
        }

        Fallback(map, headerCells.Count);
        return map;
    }

    private static void Fallback(ColumnMap map, int colCount)
    {
        if (colCount <= 0)
            return;

        var taken = new HashSet<int>();
        void Pick(ref int slot, int prefer)
        {
            if (slot >= 0)
                return;
            var p = Math.Clamp(prefer, 0, colCount - 1);
            if (!taken.Contains(p))
            {
                slot = p;
                taken.Add(p);
                return;
            }

            for (var i = 0; i < colCount; i++)
            {
                if (taken.Contains(i))
                    continue;
                slot = i;
                taken.Add(i);
                return;
            }
        }

        Pick(ref map.Day, 0);
        Pick(ref map.Time, 1);
        Pick(ref map.Frequency, 2);
        Pick(ref map.Room, 3);
        Pick(ref map.Group, 4);
        Pick(ref map.ActivityType, 5);
        Pick(ref map.ClassName, 6);
        Pick(ref map.Professor, 7);
    }

    private static bool MatchesAny(string cell, params string[] tokens) =>
        tokens.Any(t => cell.Contains(t, StringComparison.Ordinal));

    private static string GetCell(IReadOnlyList<string> row, int index)
    {
        if (index < 0 || index >= row.Count)
            return string.Empty;
        return row[index].Trim();
    }

    private static string NormalizeActivityType(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        var t = raw.Trim();
        if (t.Contains("laborator", StringComparison.OrdinalIgnoreCase))
            return "Laborator";
        if (t.Contains("seminar", StringComparison.OrdinalIgnoreCase))
            return "Seminar";
        if (t.Contains("curs", StringComparison.OrdinalIgnoreCase))
            return "Curs";
        if (t.Contains("proiect", StringComparison.OrdinalIgnoreCase))
            return "Proiect";
        if (t.Contains("consult", StringComparison.OrdinalIgnoreCase))
            return "Consultatie";

        return char.ToUpper(t[0]) + t[1..];
    }
}
