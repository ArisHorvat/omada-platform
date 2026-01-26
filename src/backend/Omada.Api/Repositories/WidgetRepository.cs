using System.Data;
using Dapper;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class WidgetRepository : IWidgetRepository
{
    private readonly IDbConnection _dbConnection;

    public WidgetRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task SetEnabledWidgetsAsync(Guid organizationId, IEnumerable<string> widgetKeys, IDbTransaction transaction)
    {
        // 1. Clear existing widgets for this org (simple reset)
        await transaction.Connection.ExecuteAsync("DELETE FROM OrganizationWidgets WHERE OrganizationId = @OrgId", new { OrgId = organizationId }, transaction);

        // 2. Insert new selection
        const string sql = "INSERT INTO OrganizationWidgets (OrganizationId, WidgetKey) VALUES (@OrgId, @Key);";
        await transaction.Connection.ExecuteAsync(sql, widgetKeys.Select(k => new { OrgId = organizationId, Key = k }), transaction);
    }

    public async Task<IEnumerable<string>> GetEnabledWidgetsAsync(Guid organizationId)
    {
        const string sql = "SELECT WidgetKey FROM OrganizationWidgets WHERE OrganizationId = @OrganizationId;";
        return await _dbConnection.QueryAsync<string>(sql, new { OrganizationId = organizationId });
    }
}
