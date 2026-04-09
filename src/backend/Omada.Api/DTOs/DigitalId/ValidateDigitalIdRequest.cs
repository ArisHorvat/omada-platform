namespace Omada.Api.DTOs.DigitalId;

public class ValidateDigitalIdRequest
{
    /// <summary>JWT string scanned from the user&apos;s QR code.</summary>
    public required string Token { get; set; }
}
