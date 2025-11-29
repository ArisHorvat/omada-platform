using Dapper;
using System.Data;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;

namespace Omada.Api.Repositories;

public class OrganizationRepository : IOrganizationRepository
{
    private readonly IDbConnection _dbConnection;

    public OrganizationRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task CreateAsync(Organization organization, IDbTransaction transaction)
    {
        const string sql = """
            INSERT INTO Organizations (Id, Name, ShortName, EmailDomain, LogoUrl, PrimaryColor, SecondaryColor, AccentColor)
            VALUES (@Id, @Name, @ShortName, @EmailDomain, @LogoUrl, @PrimaryColor, @SecondaryColor, @AccentColor);
        """;
        await transaction.Connection.ExecuteAsync(sql, organization, transaction);
    }

    public async Task<Organization?> GetByIdAsync(Guid id, IDbTransaction? transaction = null)
    {
        const string sql = "SELECT * FROM Organizations WHERE Id = @Id;";
        var connection = transaction?.Connection ?? _dbConnection;
        return await connection.QuerySingleOrDefaultAsync<Organization>(sql, new { Id = id }, transaction);
    }
    
    public async Task UpdateAsync(Organization organization, IDbTransaction transaction)
    {
        const string sql = """
            UPDATE Organizations 
            SET Name = @Name, 
                EmailDomain = @EmailDomain,
                PrimaryColor = @PrimaryColor, SecondaryColor = @SecondaryColor, AccentColor = @AccentColor
            WHERE Id = @Id;
        """;
        await transaction.Connection.ExecuteAsync(sql, organization, transaction);
    }

    public async Task DeleteAsync(Guid id, IDbTransaction transaction)
    {
        const string sql = "DELETE FROM Organizations WHERE Id = @Id;";
        await transaction.Connection.ExecuteAsync(sql, new { Id = id }, transaction);
    }

    public async Task<bool> ExistsByDomainAsync(string emailDomain)
    {
        const string sql = "SELECT COUNT(1) FROM Organizations WHERE EmailDomain = @EmailDomain;";

        return await _dbConnection.ExecuteScalarAsync<bool>(sql, new { EmailDomain = emailDomain });
    }

    public async Task<IEnumerable<Organization>> GetAllAsync()
    {
        const string sql = "SELECT * FROM Organizations;";
        return await _dbConnection.QueryAsync<Organization>(sql);
    }
}
