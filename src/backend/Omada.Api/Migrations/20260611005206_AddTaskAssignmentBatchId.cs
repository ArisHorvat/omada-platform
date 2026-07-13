using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskAssignmentBatchId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InstructorsJson",
                table: "CourseOfferingPackageItems",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_OrganizationId",
                table: "TaskItems");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignmentBatchId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_OrganizationId_AssignmentBatchId",
                table: "TaskItems",
                columns: new[] { "OrganizationId", "AssignmentBatchId" },
                filter: "[AssignmentBatchId] IS NOT NULL AND [IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TaskItems_OrganizationId_AssignmentBatchId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "AssignmentBatchId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "InstructorsJson",
                table: "CourseOfferingPackageItems");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_OrganizationId",
                table: "TaskItems",
                column: "OrganizationId");
        }
    }
}
