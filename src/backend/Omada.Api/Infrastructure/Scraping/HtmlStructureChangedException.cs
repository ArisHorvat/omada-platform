namespace Omada.Api.Infrastructure.Scraping;

/// <summary>
/// Raised when the schedule page HTML no longer matches the expected table structure (missing table or zero extracted rows).
/// </summary>
public sealed class HtmlStructureChangedException : Exception
{
    public HtmlStructureChangedException(string message) : base(message)
    {
    }

    public HtmlStructureChangedException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
