using Omada.Api.DTOs.Scraping;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

/// <summary>
/// Google Gemini API (Generative Language) for NLP tasks such as news triage and schedule extraction fallback.
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Classifies a news excerpt into a <see cref="NewsCategory"/>; returns <see cref="NewsCategory.General"/> if the API is unavailable or the response is invalid.
    /// </summary>
    Task<NewsCategory> CategorizeNewsExcerptAsync(string excerpt, CancellationToken cancellationToken = default);

    /// <summary>
    /// Extracts timetable rows as JSON matching <see cref="ScrapedEventDto"/> from unstructured plain text (HTML stripped). Returns empty if the API fails or JSON is invalid.
    /// </summary>
    Task<IReadOnlyList<ScrapedEventDto>> ExtractScheduleFromRawTextAsync(string rawText, CancellationToken cancellationToken = default);
}
