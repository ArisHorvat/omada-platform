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
        "time", "ora", "orar", "interval", "hour",
        "room", "sala", "classroom", "cabinet",
        "course", "curs", "class", "disciplina", "materie", "subject",
        "professor", "prof", "teacher", "titular", "cadru",
        "group", "grup", "grupa", "serie"
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
            return ExtractScheduleFromTableCore(html);
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

    /// <summary>HtmlAgilityPack-only extraction; throws <see cref="HtmlStructureChangedException"/> when no schedule rows can be read.</summary>
    private List<ScrapedEventDto> ExtractScheduleFromTableCore(string html)
    {
        try
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            HtmlNode? table = null;
            foreach (var t in doc.DocumentNode.SelectNodes("//table") ?? Enumerable.Empty<HtmlNode>())
            {
                if (TableLooksLikeSchedule(t))
                {
                    table = t;
                    break;
                }
            }

            table ??= doc.DocumentNode.SelectSingleNode("//table");

            if (table == null)
                throw new HtmlStructureChangedException("No HTML <table> found or no schedule-like table matched.");

            var grid = ParseTableIntoGrid(table);
            if (grid.Count == 0)
                throw new HtmlStructureChangedException("Schedule table parsed to an empty grid (structure may have changed).");

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

                var dto = new ScrapedEventDto
                {
                    Time = GetCell(row, columnMap.Time),
                    ClassName = GetCell(row, columnMap.ClassName),
                    Room = GetCell(row, columnMap.Room),
                    Professor = GetCell(row, columnMap.Professor),
                    GroupNumber = GetCell(row, columnMap.Group)
                };

                if (string.IsNullOrWhiteSpace(dto.ClassName) && string.IsNullOrWhiteSpace(dto.Time))
                    continue;

                results.Add(dto);
            }

            if (results.Count == 0)
                throw new HtmlStructureChangedException("HtmlAgilityPack completed but extracted zero class rows.");

            return results;
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

        foreach (var tr in rows.Take(3))
        {
            var cells = tr.SelectNodes("./th|./td");
            if (cells == null || cells.Count == 0)
                continue;

            var joined = string.Join(" ", cells.Select(c => c.InnerText)).ToLowerInvariant();
            var matches = ScheduleHeaderKeywords.Count(k => joined.Contains(k, StringComparison.Ordinal));
            if (matches >= 2)
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
        public int Time = -1;
        public int ClassName = -1;
        public int Room = -1;
        public int Professor = -1;
        public int Group = -1;
    }

    private static ColumnMap MapColumnsFromHeaderRow(IReadOnlyList<string> headerCells)
    {
        var map = new ColumnMap();
        for (var i = 0; i < headerCells.Count; i++)
        {
            var h = headerCells[i].ToLowerInvariant();
            if (map.Time < 0 && MatchesAny(h, "time", "ora", "interval", "hour", "zi", "day"))
                map.Time = i;
            if (map.ClassName < 0 && MatchesAny(h, "curs", "disciplina", "materie", "class", "course", "subject", "denumire"))
                map.ClassName = i;
            if (map.Room < 0 && MatchesAny(h, "room", "sala", "cabinet", "classroom"))
                map.Room = i;
            if (map.Professor < 0 && MatchesAny(h, "prof", "teacher", "titular", "cadru"))
                map.Professor = i;
            if (map.Group < 0 && MatchesAny(h, "group", "grup", "grupa", "serie"))
                map.Group = i;
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

        Pick(ref map.Time, 0);
        Pick(ref map.ClassName, 1);
        Pick(ref map.Room, 2);
        Pick(ref map.Professor, 3);
        Pick(ref map.Group, 4);
    }

    private static bool MatchesAny(string cell, params string[] tokens) =>
        tokens.Any(t => cell.Contains(t, StringComparison.Ordinal));

    private static string GetCell(IReadOnlyList<string> row, int index)
    {
        if (index < 0 || index >= row.Count)
            return string.Empty;
        return row[index].Trim();
    }
}
