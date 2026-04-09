using System.Security.Cryptography;
using System.Text;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Infrastructure.Scraping;

public static class ScrapedEventHasher
{
    /// <summary>
    /// Stable SHA-256 over normalized timetable fields. Used to detect adds/updates without comparing every column manually.
    /// </summary>
    public static string CalculateHash(ScrapedEventDto dto)
    {
        var payload = string.Join('|',
            Normalize(dto.ClassName),
            Normalize(dto.Time),
            Normalize(dto.Room),
            Normalize(dto.Professor),
            Normalize(dto.GroupNumber));

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string Normalize(string? value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).Trim();
}
