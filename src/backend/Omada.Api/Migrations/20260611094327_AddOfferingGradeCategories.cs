using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferingGradeCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GradeCategoryId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OfferingGradeCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(6,4)", precision: 6, scale: 4, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsBonus = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferingGradeCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfferingGradeCategories_CourseOfferings_OfferingId",
                        column: x => x.OfferingId,
                        principalTable: "CourseOfferings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OfferingGradeCategories_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_GradeCategoryId",
                table: "TaskItems",
                column: "GradeCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferingGradeCategories_OfferingId_SortOrder",
                table: "OfferingGradeCategories",
                columns: new[] { "OfferingId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_OfferingGradeCategories_OrganizationId",
                table: "OfferingGradeCategories",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_OfferingGradeCategories_GradeCategoryId",
                table: "TaskItems",
                column: "GradeCategoryId",
                principalTable: "OfferingGradeCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_OfferingGradeCategories_GradeCategoryId",
                table: "TaskItems");

            migrationBuilder.DropTable(
                name: "OfferingGradeCategories");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_GradeCategoryId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "GradeCategoryId",
                table: "TaskItems");
        }
    }
}
