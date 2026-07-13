using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnsurePackageItemInstructorsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('CourseOfferingPackageItems', 'InstructorsJson') IS NULL
                    ALTER TABLE [CourseOfferingPackageItems] ADD [InstructorsJson] nvarchar(4000) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InstructorsJson",
                table: "CourseOfferingPackageItems");
        }
    }
}
