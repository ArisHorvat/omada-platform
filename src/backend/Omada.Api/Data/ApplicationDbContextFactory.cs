using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Omada.Api.Abstractions;

namespace Omada.Api.Data;

/// <summary>
/// Design-time factory so <c>dotnet ef</c> can create <see cref="ApplicationDbContext"/> without HTTP/JWT.
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var basePath = Directory.GetCurrentDirectory();

        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection");
        optionsBuilder.UseSqlServer(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options, new DesignTimeTenantAccessor());
    }

    private sealed class DesignTimeTenantAccessor : ITenantAccessor
    {
        public Guid? CurrentOrganizationId => null;
    }
}
