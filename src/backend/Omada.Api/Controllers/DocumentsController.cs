using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Documents;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

/// <summary>
/// Corporate document library — metadata in SQL, bytes on local disk via <see cref="Infrastructure.Storage.IOrganizationDocumentStorage"/>.
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IOrganizationDocumentService _documentService;

    public DocumentsController(IOrganizationDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet("categories")]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.View))]
    public ActionResult<ServiceResponse<List<DocumentCategoryDto>>> GetCategories()
    {
        var response = _documentService.GetCategories();
        return Ok(response);
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<OrganizationDocumentDto>>>> List(
        [FromQuery] OrganizationDocumentListRequest request)
    {
        var response = await _documentService.ListAsync(request);
        if (!response.IsSuccess)
        {
            if (response.Error?.Code == ErrorCodes.Forbidden)
                return StatusCode(403, response);
            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<OrganizationDocumentDto>>> GetById(Guid id)
    {
        var response = await _documentService.GetByIdAsync(id);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return BadRequest(response);
    }

    [HttpGet("{id:guid}/download")]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.View))]
    public async Task<IActionResult> Download(Guid id)
    {
        var (meta, content, downloadName) = await _documentService.OpenDownloadAsync(id);
        if (meta == null || content == null || downloadName == null)
            return NotFound(new ServiceResponse(false, new AppError(ErrorCodes.NotFound, "Document not found.")));

        return File(content, meta.ContentType, downloadName);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.Edit))]
    [RequestSizeLimit(26 * 1024 * 1024)]
    public async Task<ActionResult<ServiceResponse<OrganizationDocumentDto>>> Upload(
        [FromForm] IFormFile file,
        [FromForm] string? title = null,
        [FromForm] string? category = null,
        [FromForm] string? description = null)
    {
        var response = await _documentService.UploadAsync(file, title, category, description);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<OrganizationDocumentDto>>> Update(
        Guid id,
        [FromBody] UpdateOrganizationDocumentRequest request)
    {
        var response = await _documentService.UpdateAsync(id, request);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Documents, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid id)
    {
        var response = await _documentService.DeleteAsync(id);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return BadRequest(response);
    }
}
