using Microsoft.AspNetCore.Mvc;
using Omada.Api.Services.Interfaces;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Import;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolsController : ControllerBase
{
    private readonly IColorExtractionService _colorService;
    private readonly IImportService _importService;

    public ToolsController(IColorExtractionService colorService, IImportService importService)
    {
        _colorService = colorService;
        _importService = importService;
    }

    [HttpPost("extract-colors")]
    [ProducesResponseType(typeof(ServiceResponse<List<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExtractColors(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, "No file uploaded")));

        using var stream = file.OpenReadStream();
        var result = await _colorService.ExtractColorsAsync(stream);

        if (result.IsFailure)
        {
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.OperationFailed, result.Error)));
        }
        
        return Ok(new ServiceResponse<List<string>>(true, result.Value));
    }

    [HttpPost("parse-users")]
    [ProducesResponseType(typeof(ServiceResponse<List<UserImportDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ParseUsers(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, "No file uploaded")));

        using var stream = file.OpenReadStream();
        var result = await _importService.ParseUsersAsync(stream, file.FileName);

        if (result.IsFailure)
        {
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.OperationFailed, result.Error)));
        }

        return Ok(new ServiceResponse<List<UserImportDto>>(true, result.Value));
    }
}