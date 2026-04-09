namespace Omada.Api.Infrastructure.Options;

/// <summary>
/// QR / barcode token settings for Digital ID (short-lived JWT).
/// </summary>
public class DigitalIdOptions
{
    public const string SectionName = "DigitalId";

    /// <summary>JWT lifetime for the rotating QR payload (seconds). Default 60.</summary>
    public int TokenLifetimeSeconds { get; set; } = 60;

    /// <summary>
    /// Separate JWT audience so Digital ID tokens are not interchangeable with login access tokens.
    /// </summary>
    public string QrAudience { get; set; } = "https://omada.app/digital-id-qr";

    /// <summary>
    /// If set, <c>POST /api/digital-id/validate</c> requires header <c>X-Scanner-Key</c> to match.
    /// Leave empty only for local development.
    /// </summary>
    public string? ScannerApiKey { get; set; }
}
