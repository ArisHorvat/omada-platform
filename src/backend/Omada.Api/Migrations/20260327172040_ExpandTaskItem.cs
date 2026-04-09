using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandTaskItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Users_UserId",
                table: "TaskItems");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "TaskItems",
                newName: "AssigneeId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskItems_UserId",
                table: "TaskItems",
                newName: "IX_TaskItems_AssigneeId");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql("UPDATE TaskItems SET CreatedByUserId = AssigneeId WHERE CreatedByUserId IS NULL");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedByUserId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TaskItems",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Grade",
                table: "TaskItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxScore",
                table: "TaskItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Priority",
                table: "TaskItems",
                type: "tinyint",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceUrl",
                table: "TaskItems",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SubjectId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubmissionUrl",
                table: "TaskItems",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeacherFeedback",
                table: "TaskItems",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "TaskItems",
                type: "decimal(6,4)",
                precision: 6,
                scale: 4,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_CreatedByUserId",
                table: "TaskItems",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Users_AssigneeId",
                table: "TaskItems",
                column: "AssigneeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Users_CreatedByUserId",
                table: "TaskItems",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Users_AssigneeId",
                table: "TaskItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Users_CreatedByUserId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_CreatedByUserId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "MaxScore",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "ReferenceUrl",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "SubjectId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "SubmissionUrl",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "TeacherFeedback",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "TaskItems");

            migrationBuilder.RenameColumn(
                name: "AssigneeId",
                table: "TaskItems",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskItems_AssigneeId",
                table: "TaskItems",
                newName: "IX_TaskItems_UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Users_UserId",
                table: "TaskItems",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
