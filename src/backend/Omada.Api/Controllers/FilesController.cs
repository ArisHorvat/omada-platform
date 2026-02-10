using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public FilesController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        try 
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            // Ensure the uploads directory exists
            var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // Create a unique filename
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save the file
            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the public URL of the file
            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            return Ok(new ServiceResponse<object>(true, new { url = fileUrl }));
        }
        catch (UnauthorizedAccessException)
        {
            var error = new AppError(ErrorCodes.Unauthorized, "Your session has expired.");
            return Unauthorized(new ServiceResponse(false, error));
        }
        catch (Exception ex)
        {
            var error = new AppError(ErrorCodes.InternalError, ex.Message);
            return StatusCode(500, new ServiceResponse(false, error));
        }
    }
}
