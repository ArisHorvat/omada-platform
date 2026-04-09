using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class EventResolutionAndTeacherFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Users_HostId",
                table: "Events");

            migrationBuilder.RenameColumn(
                name: "HostId",
                table: "Events",
                newName: "TeacherId");

            migrationBuilder.RenameIndex(
                name: "IX_Events_HostId",
                table: "Events",
                newName: "IX_Events_TeacherId");

            migrationBuilder.AddColumn<Guid>(
                name: "RoomId",
                table: "ScrapedClassEvents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TeacherId",
                table: "ScrapedClassEvents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScrapedClassEvents_RoomId",
                table: "ScrapedClassEvents",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapedClassEvents_TeacherId",
                table: "ScrapedClassEvents",
                column: "TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Users_TeacherId",
                table: "Events",
                column: "TeacherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ScrapedClassEvents_Rooms_RoomId",
                table: "ScrapedClassEvents",
                column: "RoomId",
                principalTable: "Rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ScrapedClassEvents_Users_TeacherId",
                table: "ScrapedClassEvents",
                column: "TeacherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Users_TeacherId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_ScrapedClassEvents_Rooms_RoomId",
                table: "ScrapedClassEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_ScrapedClassEvents_Users_TeacherId",
                table: "ScrapedClassEvents");

            migrationBuilder.DropIndex(
                name: "IX_ScrapedClassEvents_RoomId",
                table: "ScrapedClassEvents");

            migrationBuilder.DropIndex(
                name: "IX_ScrapedClassEvents_TeacherId",
                table: "ScrapedClassEvents");

            migrationBuilder.DropColumn(
                name: "RoomId",
                table: "ScrapedClassEvents");

            migrationBuilder.DropColumn(
                name: "TeacherId",
                table: "ScrapedClassEvents");

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
        }
    }
}
