using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public sealed class GeminiService : IGeminiService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiService> _logger;

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions ScheduleJsonDeserializeOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GeminiService(HttpClient http, IConfiguration configuration, ILogger<GeminiService> logger)
    {
        _http = http;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<NewsCategory> CategorizeNewsExcerptAsync(string excerpt, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(excerpt))
            return NewsCategory.General;

        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogDebug("Gemini:ApiKey is not configured; skipping triage.");
            return NewsCategory.General;
        }

        var model = _configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={Uri.EscapeDataString(apiKey)}";

        const string instruction =
            "You are an organization news triage assistant. Content may come from a university or a company — choose the best fit. " +
            "Read the excerpt and assign exactly ONE category. Valid labels (use the exact PascalCase name, no spaces): " +
            "General, Academic, Urgent, Facilities, PeopleAndCulture, EventsAndPrograms, ResearchAndInnovation, " +
            "CommunityAndEngagement, OperationsAndBusiness, ComplianceAndSecurity. " +
            "General = miscellaneous; Academic = courses/teaching/exams; Urgent = critical or time-sensitive; Facilities = buildings/IT infra; " +
            "PeopleAndCulture = HR/culture/benefits; EventsAndPrograms = events/workshops/town halls; ResearchAndInnovation = research or R&D; " +
            "CommunityAndEngagement = students/clubs/ERGs/community; OperationsAndBusiness = finance/strategy/ops; ComplianceAndSecurity = legal/safety/security. " +
            "Return ONLY that single label string with no markdown, brackets, or quotes.";

        var text = $"{instruction}\n\nNews excerpt:\n{excerpt.Trim()}";
        if (text.Length > 12_000)
            text = text[..12_000];

        var body = new
        {
            contents = new object[]
            {
                new { parts = new object[] { new { text } } }
            },
            generationConfig = new { temperature = 0.1, maxOutputTokens = 48 }
        };

        try
        {
            using var response = await _http.PostAsJsonAsync(url, body, SerializerOptions, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Gemini API returned {Status}: {Body}", response.StatusCode, err);
                return NewsCategory.General;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;
            if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
                return NewsCategory.General;

            var parts = candidates[0].GetProperty("content").GetProperty("parts");
            var raw = parts[0].GetProperty("text").GetString();
            return ParseCategoryLabel(raw);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini categorization failed.");
            return NewsCategory.General;
        }
    }

    private static NewsCategory ParseCategoryLabel(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return NewsCategory.General;

        var s = raw.Trim().Trim('[', ']', '"', '\'').Trim();
        foreach (NewsCategory cat in Enum.GetValues<NewsCategory>())
        {
            if (string.Equals(s, cat.ToString(), StringComparison.OrdinalIgnoreCase))
                return cat;
        }

        // Model sometimes adds spaces: "People And Culture"
        var compact = new string(s.Where(char.IsLetterOrDigit).ToArray());
        foreach (NewsCategory cat in Enum.GetValues<NewsCategory>())
        {
            if (string.Equals(compact, cat.ToString(), StringComparison.OrdinalIgnoreCase))
                return cat;
        }

        return NewsCategory.General;
    }

    public async Task<IReadOnlyList<ScrapedEventDto>> ExtractScheduleFromRawTextAsync(string rawText, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawText))
            return Array.Empty<ScrapedEventDto>();

        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogDebug("Gemini:ApiKey is not configured; schedule extraction fallback skipped.");
            return Array.Empty<ScrapedEventDto>();
        }

        var model = _configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={Uri.EscapeDataString(apiKey)}";

        var bodyText = rawText.Trim();
        if (bodyText.Length > 28_000)
            bodyText = bodyText[..28_000];

        const string instruction =
            "You extract timetable / class schedule rows from unstructured plain text (university or corporate). " +
            "Return ONLY a valid JSON array. No markdown, no code fences (no ```), no commentary before or after the JSON. " +
            "Each array element must be one JSON object with EXACTLY these five string properties: " +
            "\"ClassName\", \"Time\", \"Room\", \"Professor\", \"GroupNumber\". " +
            "Use empty string \"\" for any field that is unknown. " +
            "Example output: [{\"ClassName\":\"Algorithms\",\"Time\":\"10:00-12:00\",\"Room\":\"C305\",\"Professor\":\"Jane Doe\",\"GroupNumber\":\"A2\"}]. " +
            "If there are no schedule rows, return an empty array [].";

        var text = $"{instruction}\n\nPlain text:\n{bodyText}";

        var body = new
        {
            contents = new object[]
            {
                new { parts = new object[] { new { text } } }
            },
            generationConfig = new { temperature = 0.1, maxOutputTokens = 8192 }
        };

        try
        {
            using var response = await _http.PostAsJsonAsync(url, body, SerializerOptions, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Gemini schedule extraction returned {Status}: {Body}", response.StatusCode, err);
                return Array.Empty<ScrapedEventDto>();
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var raw = ExtractGeminiResponseText(doc.RootElement);
            if (string.IsNullOrWhiteSpace(raw))
                return Array.Empty<ScrapedEventDto>();
            var json = NormalizeJsonArrayPayload(raw);
            var list = JsonSerializer.Deserialize<List<ScrapedEventDto>>(json, ScheduleJsonDeserializeOptions);
            if (list == null || list.Count == 0)
                return Array.Empty<ScrapedEventDto>();

            foreach (var row in list)
            {
                row.ClassName ??= string.Empty;
                row.Time ??= string.Empty;
                row.Room ??= string.Empty;
                row.Professor ??= string.Empty;
                row.GroupNumber ??= string.Empty;
            }

            return list;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini schedule JSON extraction failed.");
            return Array.Empty<ScrapedEventDto>();
        }
    }

    private static string? ExtractGeminiResponseText(JsonElement root)
    {
        if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            return null;
        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        return parts[0].GetProperty("text").GetString();
    }

    /// <summary>Strips accidental markdown fences and isolates the JSON array substring.</summary>
    private static string NormalizeJsonArrayPayload(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return "[]";

        var s = raw.Trim();

        if (s.StartsWith("```", StringComparison.Ordinal))
        {
            var firstLineBreak = s.IndexOf('\n');
            if (firstLineBreak >= 0)
                s = s[(firstLineBreak + 1)..];

            var fence = s.LastIndexOf("```", StringComparison.Ordinal);
            if (fence >= 0)
                s = s[..fence];

            s = s.Trim();
        }

        var start = s.IndexOf('[');
        var end = s.LastIndexOf(']');
        if (start >= 0 && end > start)
            s = s.Substring(start, end - start + 1);

        return string.IsNullOrWhiteSpace(s) ? "[]" : s;
    }
}
