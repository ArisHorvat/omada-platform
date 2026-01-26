using System.Data;
using Dapper;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;

namespace Omada.Api.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly IDbConnection _dbConnection;

    public RoleRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task AddRangeAsync(IEnumerable<Role> roles, IDbTransaction transaction)
    {
        const string sql = "INSERT INTO Roles (Id, OrganizationId, Name) VALUES (@Id, @OrganizationId, @Name);";
        await transaction.Connection.ExecuteAsync(sql, roles, transaction);
    }

    public async Task<IEnumerable<Role>> GetByOrganizationIdAsync(Guid organizationId)
    {
        const string sql = "SELECT * FROM Roles WHERE OrganizationId = @OrganizationId;";
        return await _dbConnection.QueryAsync<Role>(sql, new { OrganizationId = organizationId });
    }

    public async Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction)
    {
        const string sql = "DELETE FROM Roles WHERE OrganizationId = @OrganizationId;";
        await transaction.Connection.ExecuteAsync(sql, new { OrganizationId = organizationId }, transaction);
    }

    public async Task SaveRoleWidgetAccessAsync(Guid roleId, string widgetKey, string accessLevel, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO RolePermissions (RoleId, WidgetKey, AccessLevel) 
            VALUES (@RoleId, @WidgetKey, @AccessLevel);";
        
        await transaction.Connection.ExecuteAsync(sql, new { RoleId = roleId, WidgetKey = widgetKey, AccessLevel = accessLevel }, transaction);
    }

    public async Task<IEnumerable<(string RoleName, string WidgetKey, string AccessLevel)>> GetRoleWidgetAccessAsync(Guid organizationId)
    {
        const string sql = @"
            SELECT r.Name as RoleName, rp.WidgetKey, rp.AccessLevel
            FROM RolePermissions rp
            JOIN Roles r ON rp.RoleId = r.Id
            WHERE r.OrganizationId = @OrganizationId";
        return await _dbConnection.QueryAsync<(string, string, string)>(sql, new { OrganizationId = organizationId });
    }
}
