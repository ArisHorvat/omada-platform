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
        // Matches your User entity properties to the DB columns
        const string sql = """
            INSERT INTO Users (Id, FirstName, LastName, Email, PasswordHash, PhoneNumber, ProfilePictureUrl, CNP, Address, IsTwoFactorEnabled, CreatedAt, PasswordResetToken, PasswordResetTokenExpires)
            VALUES (@Id, @FirstName, @LastName, @Email, @PasswordHash, @PhoneNumber, @ProfilePictureUrl, @CNP, @Address, @IsTwoFactorEnabled, @CreatedAt, @PasswordResetToken, @PasswordResetTokenExpires);
        """;
        await transaction.Connection.ExecuteAsync(sql, user, transaction);
    }

    public async Task<User?> GetByEmailAsync(string email, IDbTransaction? transaction = null)
    {
        const string sql = "SELECT * FROM Users WHERE Email = @Email;";
        var connection = transaction?.Connection ?? _dbConnection;
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Email = email }, transaction);
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
            SET FirstName = @FirstName, 
                LastName = @LastName, 
                PhoneNumber = @PhoneNumber, 
                ProfilePictureUrl = @ProfilePictureUrl,
                Address = @Address,
                PasswordHash = @PasswordHash,
                IsTwoFactorEnabled = @IsTwoFactorEnabled,
                PasswordResetToken = @PasswordResetToken,
                PasswordResetTokenExpires = @PasswordResetTokenExpires
            WHERE Id = @Id;
        """;
        await _dbConnection.ExecuteAsync(sql, user);
    }

    public async Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction)
    {
        // Delete users who are ONLY part of this organization
        // (This logic might be dangerous if users belong to multiple orgs. 
        //  Safest is to just delete the Membership, which cascades via FK in DB)
        
        const string sql = "DELETE FROM OrganizationMembers WHERE OrganizationId = @OrganizationId;";
        await transaction.Connection.ExecuteAsync(sql, new { OrganizationId = organizationId }, transaction);
    }

    // --- FIX 1: Use RoleId (Guid) instead of Role (string) ---
    public async Task AddMemberAsync(Guid organizationId, Guid userId, Guid roleId, IDbTransaction transaction)
    {
        const string sql = "INSERT INTO OrganizationMembers (OrganizationId, UserId, RoleId) VALUES (@OrganizationId, @UserId, @RoleId);";
        await transaction.Connection.ExecuteAsync(sql, new { OrganizationId = organizationId, UserId = userId, RoleId = roleId }, transaction);
    }

    // --- FIX 2: Join Roles table to get the Name (since DB only stores ID now) ---
    public async Task<IEnumerable<OrganizationMember>> GetMembershipsAsync(Guid userId)
    {
        // We select r.Name as 'Role' to populate the legacy Role string property on the Entity if needed
        const string sql = @"
            SELECT om.*, r.Name as Role 
            FROM OrganizationMembers om
            JOIN Roles r ON om.RoleId = r.Id
            WHERE om.UserId = @UserId;";
            
        return await _dbConnection.QueryAsync<OrganizationMember>(sql, new { UserId = userId });
    }

    // --- FIX 3: Optimized Permission Query using IDs ---
    public async Task<IEnumerable<(string WidgetKey, string AccessLevel)>> GetUserWidgetAccessAsync(Guid userId, Guid organizationId)
    {
        const string sql = @"
            SELECT rp.WidgetKey, rp.AccessLevel
            FROM OrganizationMembers om
            -- Join directly on RoleId (Fast)
            INNER JOIN RolePermissions rp ON om.RoleId = rp.RoleId
            -- Filter by Global Organization Config
            INNER JOIN OrganizationWidgets ow ON om.OrganizationId = ow.OrganizationId 
                AND rp.WidgetKey = ow.WidgetKey
            WHERE om.UserId = @UserId AND om.OrganizationId = @OrganizationId";
            
        return await _dbConnection.QueryAsync<(string, string)>(sql, new { UserId = userId, OrganizationId = organizationId });
    }
}