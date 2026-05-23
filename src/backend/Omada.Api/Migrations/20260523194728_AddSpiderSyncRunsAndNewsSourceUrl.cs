using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSpiderSyncRunsAndNewsSourceUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_News_OrganizationId",
                table: "News");

            migrationBuilder.AddColumn<string>(
                name: "SourceContentHash",
                table: "News",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "News",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SpiderSyncRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kind = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ItemsProcessed = table.Column<int>(type: "int", nullable: false),
                    ItemsCreated = table.Column<int>(type: "int", nullable: false),
                    ItemsUpdated = table.Column<int>(type: "int", nullable: false),
                    ItemsRemoved = table.Column<int>(type: "int", nullable: false),
                    ItemsSkipped = table.Column<int>(type: "int", nullable: false),
                    InitiatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    HangfireJobId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpiderSyncRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpiderSyncRuns_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_News_OrganizationId_SourceUrl",
                table: "News",
                columns: new[] { "OrganizationId", "SourceUrl" },
                unique: true,
                filter: "[SourceUrl] IS NOT NULL AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_SpiderSyncRuns_OrganizationId_StartedAt",
                table: "SpiderSyncRuns",
                columns: new[] { "OrganizationId", "StartedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SpiderSyncRuns");

            migrationBuilder.DropIndex(
                name: "IX_News_OrganizationId_SourceUrl",
                table: "News");

            migrationBuilder.DropColumn(
                name: "SourceContentHash",
                table: "News");

            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "News");

            migrationBuilder.CreateIndex(
                name: "IX_News_OrganizationId",
                table: "News",
                column: "OrganizationId");
        }
    }
}
