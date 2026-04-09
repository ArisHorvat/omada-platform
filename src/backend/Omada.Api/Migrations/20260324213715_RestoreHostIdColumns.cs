using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class RestoreHostIdColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Users_TeacherId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_ScrapedClassEvents_Users_TeacherId",
                table: "ScrapedClassEvents");

            migrationBuilder.RenameColumn(
                name: "TeacherId",
                table: "ScrapedClassEvents",
                newName: "HostId");

            migrationBuilder.RenameIndex(
                name: "IX_ScrapedClassEvents_TeacherId",
                table: "ScrapedClassEvents",
                newName: "IX_ScrapedClassEvents_HostId");

            migrationBuilder.RenameColumn(
                name: "TeacherId",
                table: "Events",
                newName: "HostId");

            migrationBuilder.RenameIndex(
                name: "IX_Events_TeacherId",
                table: "Events",
                newName: "IX_Events_HostId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Users_HostId",
                table: "Events",
                column: "HostId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ScrapedClassEvents_Users_HostId",
                table: "ScrapedClassEvents",
                column: "HostId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Users_HostId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_ScrapedClassEvents_Users_HostId",
                table: "ScrapedClassEvents");

            migrationBuilder.RenameColumn(
                name: "HostId",
                table: "ScrapedClassEvents",
                newName: "TeacherId");

            migrationBuilder.RenameIndex(
                name: "IX_ScrapedClassEvents_HostId",
                table: "ScrapedClassEvents",
                newName: "IX_ScrapedClassEvents_TeacherId");

            migrationBuilder.RenameColumn(
                name: "HostId",
                table: "Events",
                newName: "TeacherId");

            migrationBuilder.RenameIndex(
                name: "IX_Events_HostId",
                table: "Events",
                newName: "IX_Events_TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Users_TeacherId",
                table: "Events",
                column: "TeacherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ScrapedClassEvents_Users_TeacherId",
                table: "ScrapedClassEvents",
                column: "TeacherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
