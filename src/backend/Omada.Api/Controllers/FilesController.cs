using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Files;

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

    /// <summary>
    /// Upload a public file. Default scope stores under avatars; scope "news" uses /news/images or /news/documents by content type.
    /// </summary>
    [HttpPost("upload")]
    public async Task<ActionResult<ServiceResponse<FileUploadResponse>>> Upload(
        [FromForm] IFormFile file,
        [FromForm] string? scope = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, "No file uploaded.")));
        }

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        string relativePath;
        string targetDir;

        if (string.Equals(scope, "news", StringComparison.OrdinalIgnoreCase))
        {
            var isImage = file.ContentType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true;
            var segment = isImage ? "images" : "documents";
            targetDir = Path.Combine(webRoot, "news", segment);
            if (!Directory.Exists(targetDir))
                Directory.CreateDirectory(targetDir);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(targetDir, fileName);
            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            relativePath = $"/news/{segment}/{fileName}";
        }
        else
        {
            var avatarsPath = Path.Combine(webRoot, "images", "avatars");
            if (!Directory.Exists(avatarsPath))
                Directory.CreateDirectory(avatarsPath);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(avatarsPath, fileName);
            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            relativePath = $"/images/avatars/{fileName}";
        }

        return Ok(new ServiceResponse<FileUploadResponse>(true, new FileUploadResponse { Url = relativePath }));
    }
}
