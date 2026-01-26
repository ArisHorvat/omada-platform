using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        var tasks = await _repository.GetByUserIdAsync(GetUserId());
        return Ok(tasks);
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
        return Ok(task);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskRequest request)
    {
        var task = new TaskItem { Id = id, UserId = GetUserId(), Title = request.Title, IsCompleted = request.IsCompleted, DueDate = request.DueDate };
        await _repository.UpdateAsync(task);
        return Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _repository.DeleteAsync(id, GetUserId());
        return NoContent();
    }
}

public class CreateTaskRequest { public string Title { get; set; } = ""; public DateTime? DueDate { get; set; } }
public class UpdateTaskRequest { public string Title { get; set; } = ""; public bool IsCompleted { get; set; } public DateTime? DueDate { get; set; } }