using System.Data;
using Dapper;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;

namespace Omada.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IDbConnection _dbConnection;

    public UserRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task CreateAsync(User user, IDbTransaction transaction)
    {
        const string sql = """
            INSERT INTO Users (Id, OrganizationId, FullName, Email, Role, PasswordHash)
            VALUES (@Id, @OrganizationId, @FullName, @Email, @Role, @PasswordHash);
        """;
        await transaction.Connection.ExecuteAsync(sql, user, transaction);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = "SELECT * FROM Users WHERE Email = @Email;";
        return await _dbConnection.QuerySingleOrDefaultAsync<User>(sql, new { Email = email });
    }
}
