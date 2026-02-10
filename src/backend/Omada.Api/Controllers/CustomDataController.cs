using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
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
        try 
        {
            _logger.LogInformation("Fetching custom data for org {OrgId} widget {Widget} (Page {Page})", organizationId, widgetKey, page);
            var data = await _repository.GetDataAsync(organizationId, widgetKey, page, pageSize);
            return Ok(new ServiceResponse<IEnumerable<dynamic>>(true, data));
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

    [HttpPost]
    public async Task<IActionResult> Create(Guid organizationId, string widgetKey, [FromBody] object data)
    {
        try 
        {
            _logger.LogInformation("Saving custom data for org {OrgId} widget {Widget}", organizationId, widgetKey);
            
            if (data == null)
            {
                var error = new AppError(ErrorCodes.InvalidInput, "Data cannot be null");
                return BadRequest(new ServiceResponse(false, error));
            }

            await _repository.SaveDataAsync(organizationId, widgetKey, data);
            
            return Ok(new ServiceResponse<object>(true, data));
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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] object data)
    {
        try 
        {
            _logger.LogInformation("Updating custom data item {Id}", id);
            
            if (data == null)
            {
                var error = new AppError(ErrorCodes.InvalidInput, "Data cannot be null");
                return BadRequest(new ServiceResponse(false, error));
            }

            await _repository.UpdateDataAsync(id, data);
            
            return Ok(new ServiceResponse<object>(true, data));
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try 
        {
            _logger.LogInformation("Deleting custom data item {Id}", id);
            await _repository.DeleteDataAsync(id);
            
            return Ok(new ServiceResponse<object>(true, null));
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
