using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddScrapedClassEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScrapedClassEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClassName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Time = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Room = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Professor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    GroupNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DataHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    IsChanged = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScrapedClassEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScrapedClassEvents_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScrapedClassEvents_OrganizationId_DataHash",
                table: "ScrapedClassEvents",
                columns: new[] { "OrganizationId", "DataHash" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScrapedClassEvents");
        }
    }
}
