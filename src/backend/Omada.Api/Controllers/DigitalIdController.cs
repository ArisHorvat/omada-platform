using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.DigitalId;
using Omada.Api.Infrastructure.Options;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

/// <summary>
/// Digital ID QR validation for scanners and admin tools (not org-scoped JWT auth).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DigitalIdController : ControllerBase
{
    private readonly IDigitalIdService _digitalIdService;
    private readonly DigitalIdOptions _options;

    public DigitalIdController(IDigitalIdService digitalIdService, IOptions<DigitalIdOptions> options)
    {
        _digitalIdService = digitalIdService;
        _options = options.Value;
    }

    /// <summary>
    /// Decodes and verifies a Digital ID QR JWT (signature, audience, 60s-style lifetime).
    /// When <see cref="DigitalIdOptions.ScannerApiKey"/> is set, requires header <c>X-Scanner-Key</c>.
    /// </summary>
    [HttpPost("validate")]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceResponse<DigitalIdValidationResponse>>> Validate(
        [FromBody] ValidateDigitalIdRequest request)
    {
        if (!string.IsNullOrEmpty(_options.ScannerApiKey))
        {
            if (!Request.Headers.TryGetValue("X-Scanner-Key", out var key) || key != _options.ScannerApiKey)
            {
                return Unauthorized(new ServiceResponse<DigitalIdValidationResponse>(false, null,
                    new AppError(ErrorCodes.Unauthorized, "Invalid or missing scanner key.")));
            }
        }

        var response = await _digitalIdService.ValidateQrTokenAsync(request.Token);
        return Ok(response);
    }
}
