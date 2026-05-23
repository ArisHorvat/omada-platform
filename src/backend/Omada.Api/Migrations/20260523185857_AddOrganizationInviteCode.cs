using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationInviteCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InviteCode",
                table: "Organizations",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE Organizations
                SET InviteCode = UPPER(SUBSTRING(REPLACE(CONVERT(varchar(36), Id), '-', ''), 1, 8))
                WHERE InviteCode IS NULL
                """);

            migrationBuilder.AlterColumn<string>(
                name: "InviteCode",
                table: "Organizations",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_InviteCode",
                table: "Organizations",
                column: "InviteCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_InviteCode",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "InviteCode",
                table: "Organizations");
        }
    }
}
