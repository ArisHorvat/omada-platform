using Microsoft.AspNetCore.Mvc;
using Omada.Api.Services.Interfaces;
using Omada.Api.Abstractions;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolsController : ControllerBase
{
    private readonly IColorExtractionService _colorService;

    public ToolsController(IColorExtractionService colorService)
    {
        _colorService = colorService;
    }

    [HttpPost("extract-colors")]
    public async Task<ActionResult<ServiceResponse<List<string>>>> ExtractColors(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, "No file uploaded")));

        using var stream = file.OpenReadStream();
        var response = await _colorService.ExtractColorsAsync(stream);

        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
