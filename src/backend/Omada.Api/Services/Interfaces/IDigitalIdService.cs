using Omada.Api.Abstractions;
using Omada.Api.DTOs.DigitalId;
using Omada.Api.DTOs.Users;

namespace Omada.Api.Services.Interfaces;

public interface IDigitalIdService
{
    /// <summary>
    /// Card info + rotating QR JWT for the authenticated user in the active organization.
    /// </summary>
    Task<ServiceResponse<DigitalIdDto>> GetMyDigitalIdAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies a Digital ID QR JWT (signature, audience, lifetime). Used by scanners / admin tools.
    /// </summary>
    Task<ServiceResponse<DigitalIdValidationResponse>> ValidateQrTokenAsync(
        string token,
        CancellationToken cancellationToken = default);
}
