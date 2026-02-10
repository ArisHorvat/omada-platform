using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Tasks;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskRepository _repository;

    public TasksController(ITaskRepository repository)
    {
        _repository = repository;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var tasks = await _repository.GetByUserIdAsync(GetUserId());
            return Ok(new ServiceResponse<IEnumerable<TaskItem>>(true, tasks));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse<object>(false, null, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            UserId = GetUserId(),
            Title = request.Title,
            IsCompleted = false,
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.CreateAsync(task);
        return Ok(new ServiceResponse<TaskItem>(true, task));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskRequest request)
    {
        var task = new TaskItem { Id = id, UserId = GetUserId(), Title = request.Title, IsCompleted = request.IsCompleted, DueDate = request.DueDate };
        await _repository.UpdateAsync(task);
        return Ok(new ServiceResponse<TaskItem>(true, task));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _repository.DeleteAsync(id, GetUserId());
        return Ok(new ServiceResponse<object>(true, new { message = "Deleted" }));
    }
}
