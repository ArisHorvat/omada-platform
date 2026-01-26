using Microsoft.AspNetCore.Mvc;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/organizations/{organizationId}/widgets/{widgetKey}/data")]
public class CustomDataController : ControllerBase
{
    private readonly ICustomDataRepository _repository;
    private readonly ILogger<CustomDataController> _logger;

    public CustomDataController(ICustomDataRepository repository, ILogger<CustomDataController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid organizationId, string widgetKey, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        _logger.LogInformation("Fetching custom data for org {OrgId} widget {Widget} (Page {Page})", organizationId, widgetKey, page);
        var data = await _repository.GetDataAsync(organizationId, widgetKey, page, pageSize);
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid organizationId, string widgetKey, [FromBody] object data)
    {
        _logger.LogInformation("Saving custom data for org {OrgId} widget {Widget}", organizationId, widgetKey);
        
        if (data == null) return BadRequest("Data cannot be null");

        await _repository.SaveDataAsync(organizationId, widgetKey, data);
        
        // Return the data back so the UI can update optimistically
        return Ok(data);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] object data)
    {
        _logger.LogInformation("Updating custom data item {Id}", id);
        if (data == null) return BadRequest("Data cannot be null");
        await _repository.UpdateDataAsync(id, data);
        return Ok(data);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Deleting custom data item {Id}", id);
        await _repository.DeleteDataAsync(id);
        return NoContent();
    }
}
