using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPackageItemCredits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('CourseOfferingPackageItems', 'Credits') IS NULL
                    ALTER TABLE [CourseOfferingPackageItems] ADD [Credits] decimal(5,2) NOT NULL CONSTRAINT [DF_CourseOfferingPackageItems_Credits] DEFAULT 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Credits",
                table: "CourseOfferingPackageItems");
        }
    }
}
