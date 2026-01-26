using Dapper;
using System.Data;
using System.Text.Json;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class CustomDataRepository : ICustomDataRepository
{
    private readonly IDbConnection _dbConnection;

    public CustomDataRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<dynamic>> GetDataAsync(Guid organizationId, string widgetKey, int page = 1, int pageSize = 50)
    {
        var offset = (page - 1) * pageSize;
        // Note: This SQL syntax is for SQL Server. If using SQLite, use: LIMIT @PageSize OFFSET @Offset
        const string sql = """
            SELECT Id, DataJson, CreatedAt
            FROM WidgetData 
            WHERE OrganizationId = @OrganizationId AND WidgetKey = @WidgetKey 
            ORDER BY CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        """;
        var rows = await _dbConnection.QueryAsync<WidgetDataRow>(sql, new { OrganizationId = organizationId, WidgetKey = widgetKey, Offset = offset, PageSize = pageSize });
        
        // Deserialize JSON strings back to objects
        return rows.Select(row => {
            var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(row.DataJson) ?? new Dictionary<string, object>();
            dict["id"] = row.Id; // Inject the DB ID into the data object
            dict["createdAt"] = row.CreatedAt; // Inject the timestamp
            return dict;
        });
    }

    public async Task SaveDataAsync(Guid organizationId, string widgetKey, object data)
    {
        const string sql = """
            INSERT INTO WidgetData (OrganizationId, WidgetKey, DataJson, CreatedAt)
            VALUES (@OrganizationId, @WidgetKey, @DataJson, @CreatedAt);
        """;

        var json = JsonSerializer.Serialize(data);
        
        await _dbConnection.ExecuteAsync(sql, new { 
            OrganizationId = organizationId, 
            WidgetKey = widgetKey, 
            DataJson = json,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task UpdateDataAsync(Guid id, object data)
    {
        const string sql = "UPDATE WidgetData SET DataJson = @DataJson WHERE Id = @Id;";
        var json = JsonSerializer.Serialize(data);
        await _dbConnection.ExecuteAsync(sql, new { Id = id, DataJson = json });
    }

    public async Task DeleteDataAsync(Guid id)
    {
        const string sql = "DELETE FROM WidgetData WHERE Id = @Id;";
        await _dbConnection.ExecuteAsync(sql, new { Id = id });
    }

    // Helper class for Dapper mapping
    private class WidgetDataRow { public Guid Id { get; set; } public string DataJson { get; set; } = ""; public DateTime CreatedAt { get; set; } }
}
