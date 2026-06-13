using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class BackfillOnboardingCompletedStepsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
            migrationBuilder.Sql(
                """
                UPDATE Organizations
                SET OnboardingCompletedStepsJson = NULL
                WHERE OnboardingCompletedStepsJson = '["branding"]' AND OnboardingStep >= 3
                """);
        }
    }
}
