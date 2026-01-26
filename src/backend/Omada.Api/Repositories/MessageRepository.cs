using System.Data;
using Dapper;
using Omada.Api.Entities;

namespace Omada.Api.Repositories;

public interface IMessageRepository
{
    Task CreateAsync(Message message);
    Task<IEnumerable<Message>> GetRecentAsync(Guid organizationId, int count = 50);
}

public class MessageRepository : IMessageRepository
{
    private readonly IDbConnection _dbConnection;

    public MessageRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task CreateAsync(Message message)
    {
        const string sql = "INSERT INTO Messages (Id, OrganizationId, UserId, UserName, Content, CreatedAt) VALUES (@Id, @OrganizationId, @UserId, @UserName, @Content, @CreatedAt)";
        await _dbConnection.ExecuteAsync(sql, message);
    }

    public async Task<IEnumerable<Message>> GetRecentAsync(Guid organizationId, int count = 50)
    {
        const string sql = "SELECT TOP (@Count) * FROM Messages WHERE OrganizationId = @OrganizationId ORDER BY CreatedAt DESC";
        return await _dbConnection.QueryAsync<Message>(sql, new { OrganizationId = organizationId, Count = count });
    }
}
