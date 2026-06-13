using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationOnboardingCompletedStepsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OnboardingCompletedStepsJson",
                table: "Organizations",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE Organizations
                SET OnboardingCompletedStepsJson = '["branding"]'
                WHERE OnboardingCompletedStepsJson IS NULL AND OnboardingStep >= 3
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OnboardingCompletedStepsJson",
                table: "Organizations");
        }
    }
}
