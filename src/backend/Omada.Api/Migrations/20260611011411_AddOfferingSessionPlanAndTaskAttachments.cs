using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferingSessionPlanAndTaskAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MaterialsJson",
                table: "TaskItems",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubmissionAttachmentsJson",
                table: "TaskItems",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeeklySessionPlanJson",
                table: "CourseOfferings",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeeklySessionPlanJson",
                table: "CourseOfferingPackageItems",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaterialsJson",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "SubmissionAttachmentsJson",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "WeeklySessionPlanJson",
                table: "CourseOfferings");

            migrationBuilder.DropColumn(
                name: "WeeklySessionPlanJson",
                table: "CourseOfferingPackageItems");
        }
    }
}
