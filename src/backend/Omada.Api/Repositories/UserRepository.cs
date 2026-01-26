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
            INSERT INTO Users (Id, FirstName, LastName, Email, PasswordHash, PhoneNumber, ProfilePictureUrl, CNP, Address, IsTwoFactorEnabled, CreatedAt, PasswordResetToken, PasswordResetTokenExpires)
            VALUES (@Id, @FirstName, @LastName, @Email, @PasswordHash, @PhoneNumber, @ProfilePictureUrl, @CNP, @Address, @IsTwoFactorEnabled, @CreatedAt, @PasswordResetToken, @PasswordResetTokenExpires);
        """;
        await transaction.Connection.ExecuteAsync(sql, user, transaction);
    }

    public async Task<User?> GetByEmailAsync(string email, IDbTransaction? transaction = null)
    {
        const string sql = "SELECT * FROM Users WHERE Email = @Email;";
        return await _dbConnection.QuerySingleOrDefaultAsync<User>(sql, new { Email = email }, transaction);
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        const string sql = "SELECT * FROM Users WHERE Id = @Id;";
        return await _dbConnection.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task UpdateAsync(User user)
    {
        const string sql = """
            UPDATE Users 
            SET PasswordHash = @PasswordHash, IsTwoFactorEnabled = @IsTwoFactorEnabled, 
                PhoneNumber = @PhoneNumber, ProfilePictureUrl = @ProfilePictureUrl, Address = @Address,
                PasswordResetToken = @PasswordResetToken, PasswordResetTokenExpires = @PasswordResetTokenExpires
            WHERE Id = @Id;
        """;
        await _dbConnection.ExecuteAsync(sql, user);
    }

    public async Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction)
    {
        const string sql = "DELETE FROM Users WHERE OrganizationId = @OrganizationId;";
        await transaction.Connection.ExecuteAsync(sql, new { OrganizationId = organizationId }, transaction);
    }

    public async Task AddMemberAsync(Guid organizationId, Guid userId, string role, IDbTransaction transaction)
    {
        const string sql = "INSERT INTO OrganizationMembers (OrganizationId, UserId, Role) VALUES (@OrganizationId, @UserId, @Role);";
        await transaction.Connection.ExecuteAsync(sql, new { OrganizationId = organizationId, UserId = userId, Role = role }, transaction);
    }

    public async Task<IEnumerable<OrganizationMember>> GetMembershipsAsync(Guid userId)
    {
        const string sql = "SELECT * FROM OrganizationMembers WHERE UserId = @UserId;";
        return await _dbConnection.QueryAsync<OrganizationMember>(sql, new { UserId = userId });
    }

    public async Task<IEnumerable<(string WidgetKey, string AccessLevel)>> GetUserWidgetAccessAsync(Guid userId, Guid organizationId)
    {
        const string sql = @"
            SELECT rp.WidgetKey, rp.AccessLevel
            FROM OrganizationMembers om
            JOIN Roles r ON om.Role = r.Name AND r.OrganizationId = om.OrganizationId
            JOIN RolePermissions rp ON r.Id = rp.RoleId
            WHERE om.UserId = @UserId AND om.OrganizationId = @OrganizationId";
        return await _dbConnection.QueryAsync<(string, string)>(sql, new { UserId = userId, OrganizationId = organizationId });
    }
}
