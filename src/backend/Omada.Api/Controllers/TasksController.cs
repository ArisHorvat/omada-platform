using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<TaskItemDto>>>> GetAll(
        [FromQuery] PagedRequest request,
        [FromQuery] Guid? groupId,
        [FromQuery] Guid? offeringId)
    {
        var response = await _taskService.GetUserTasksAsync(request, groupId, offeringId);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpGet("{id:guid}")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<TaskItemDto>>> GetById(Guid id)
    {
        var response = await _taskService.GetTaskByIdAsync(id);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<TaskItemDto>>> Create([FromBody] CreateTaskRequest request)
    {
        var response = await _taskService.CreateTaskAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<TaskItemDto>>> Update(Guid id, [FromBody] UpdateTaskRequest request)
    {
        var response = await _taskService.UpdateTaskAsync(id, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPatch("{id:guid}/submission")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<TaskItemDto>>> SubmitSubmission(
        Guid id,
        [FromBody] SubmitTaskSubmissionRequest request)
    {
        var response = await _taskService.SubmitTaskSubmissionAsync(id, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid id)
    {
        var response = await _taskService.DeleteTaskAsync(id);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("batches")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<AssignmentBatchSummaryDto>>>> GetBatches(
        [FromQuery] PagedRequest request)
    {
        var response = await _taskService.GetAssignmentBatchesAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("batches/{batchId:guid}/submissions")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<AssignmentBatchSubmissionDto>>>> GetBatchSubmissions(
        Guid batchId)
    {
        var response = await _taskService.GetAssignmentBatchSubmissionsAsync(batchId);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("batches")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<CreateAssignmentBatchResultDto>>> CreateBatch(
        [FromBody] CreateAssignmentBatchRequest request)
    {
        var response = await _taskService.CreateAssignmentBatchAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("batches/{batchId:guid}")]
    [HasPermission(WidgetKeys.Tasks, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<bool>>> DeleteBatch(Guid batchId)
    {
        var response = await _taskService.DeleteAssignmentBatchAsync(batchId);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}