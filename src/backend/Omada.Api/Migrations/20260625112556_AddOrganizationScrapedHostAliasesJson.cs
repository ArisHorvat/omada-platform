using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationScrapedHostAliasesJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Organizations', 'ScrapedHostAliasesJson') IS NULL
                    ALTER TABLE [Organizations] ADD [ScrapedHostAliasesJson] nvarchar(max) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Organizations', 'ScrapedHostAliasesJson') IS NOT NULL
                    ALTER TABLE [Organizations] DROP COLUMN [ScrapedHostAliasesJson];
                """);
        }
    }
}
