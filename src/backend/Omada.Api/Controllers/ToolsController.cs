using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Services.Interfaces;

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
    public async Task<IActionResult> ExtractColors(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        using var stream = file.OpenReadStream();
        var colors = await _colorService.ExtractColorsAsync(stream);
        
        return Ok(colors);
    }

    [HttpPost("parse-users")]
    public async Task<IActionResult> ParseUsers(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        using var stream = file.OpenReadStream();
        var users = await _importService.ParseUsersAsync(stream, file.FileName);
        
        return Ok(users);
    }
}
