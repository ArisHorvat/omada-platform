using System.Data;
using Dapper;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;

namespace Omada.Api.Repositories;

public class WidgetRepository : IWidgetRepository
{
    private readonly IDbConnection _dbConnection;

    public WidgetRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task AddRangeAsync(IEnumerable<Widget> widgets, IDbTransaction transaction)
    {
        const string sql = "INSERT INTO Widgets (Id, OrganizationId, Name) VALUES (@Id, @OrganizationId, @Name);";
        await transaction.Connection.ExecuteAsync(sql, widgets, transaction);
    }

    public async Task<IEnumerable<Widget>> GetByOrganizationIdAsync(Guid organizationId)
    {
        const string sql = "SELECT * FROM Widgets WHERE OrganizationId = @OrganizationId;";
        return await _dbConnection.QueryAsync<Widget>(sql, new { OrganizationId = organizationId });
    }

    public async Task DeleteByOrganizationIdAsync(Guid organizationId, IDbTransaction transaction)
    {
        const string sql = "DELETE FROM Widgets WHERE OrganizationId = @OrganizationId;";
        await transaction.Connection.ExecuteAsync(sql, new { OrganizationId = organizationId }, transaction);
    }
}
