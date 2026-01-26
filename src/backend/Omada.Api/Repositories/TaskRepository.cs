using System.Data;
using Dapper;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly IDbConnection _dbConnection;

    public TaskRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId)
    {
        const string sql = "SELECT * FROM Tasks WHERE UserId = @UserId ORDER BY CreatedAt DESC";
        return await _dbConnection.QueryAsync<TaskItem>(sql, new { UserId = userId });
    }

    public async Task CreateAsync(TaskItem task)
    {
        const string sql = "INSERT INTO Tasks (Id, UserId, Title, IsCompleted, DueDate, CreatedAt) VALUES (@Id, @UserId, @Title, @IsCompleted, @DueDate, @CreatedAt)";
        await _dbConnection.ExecuteAsync(sql, task);
    }

    public async Task UpdateAsync(TaskItem task)
    {
        const string sql = "UPDATE Tasks SET Title = @Title, IsCompleted = @IsCompleted, DueDate = @DueDate WHERE Id = @Id AND UserId = @UserId";
        await _dbConnection.ExecuteAsync(sql, task);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        // We include UserId in the WHERE clause for security (so you can't delete someone else's task)
        const string sql = "DELETE FROM Tasks WHERE Id = @Id AND UserId = @UserId";
        await _dbConnection.ExecuteAsync(sql, new { Id = id, UserId = userId });
    }
}