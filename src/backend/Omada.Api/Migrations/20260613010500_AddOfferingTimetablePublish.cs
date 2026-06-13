using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferingTimetablePublish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "TimetablePublishedAt",
                table: "CourseOfferings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimetablePublishedEventIdsJson",
                table: "CourseOfferings",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimetablePublishedAt",
                table: "CourseOfferings");

            migrationBuilder.DropColumn(
                name: "TimetablePublishedEventIdsJson",
                table: "CourseOfferings");
        }
    }
}
