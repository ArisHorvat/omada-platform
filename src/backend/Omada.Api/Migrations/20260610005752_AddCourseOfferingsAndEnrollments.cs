using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseOfferingsAndEnrollments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OfferingId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PeriodId",
                table: "TaskItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Groups",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "ScheduleConfig",
                table: "Groups",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Groups",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Groups",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldDefaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<string>(
                name: "AcademicYear",
                table: "Groups",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CohortGroupId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OfferingId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PeriodId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CourseOfferings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PeriodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProgramGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SubjectCatalogGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    HostId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseOfferings_Groups_ProgramGroupId",
                        column: x => x.ProgramGroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferings_Groups_SubjectCatalogGroupId",
                        column: x => x.SubjectCatalogGroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferings_OrganizationPeriods_PeriodId",
                        column: x => x.PeriodId,
                        principalTable: "OrganizationPeriods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferings_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferings_Users_HostId",
                        column: x => x.HostId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "OfferingEnrollments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CohortGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferingEnrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfferingEnrollments_CourseOfferings_OfferingId",
                        column: x => x.OfferingId,
                        principalTable: "CourseOfferings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OfferingEnrollments_Groups_CohortGroupId",
                        column: x => x.CohortGroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OfferingEnrollments_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OfferingEnrollments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_OfferingId",
                table: "TaskItems",
                column: "OfferingId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_PeriodId",
                table: "TaskItems",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_CohortGroupId",
                table: "Events",
                column: "CohortGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_OfferingId",
                table: "Events",
                column: "OfferingId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_PeriodId",
                table: "Events",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferings_HostId",
                table: "CourseOfferings",
                column: "HostId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferings_OrganizationId_PeriodId_Name",
                table: "CourseOfferings",
                columns: new[] { "OrganizationId", "PeriodId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferings_PeriodId",
                table: "CourseOfferings",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferings_ProgramGroupId",
                table: "CourseOfferings",
                column: "ProgramGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferings_SubjectCatalogGroupId",
                table: "CourseOfferings",
                column: "SubjectCatalogGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferingEnrollments_CohortGroupId",
                table: "OfferingEnrollments",
                column: "CohortGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferingEnrollments_OfferingId_UserId",
                table: "OfferingEnrollments",
                columns: new[] { "OfferingId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfferingEnrollments_OrganizationId",
                table: "OfferingEnrollments",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferingEnrollments_UserId",
                table: "OfferingEnrollments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_CourseOfferings_OfferingId",
                table: "Events",
                column: "OfferingId",
                principalTable: "CourseOfferings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Groups_CohortGroupId",
                table: "Events",
                column: "CohortGroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_OrganizationPeriods_PeriodId",
                table: "Events",
                column: "PeriodId",
                principalTable: "OrganizationPeriods",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_CourseOfferings_OfferingId",
                table: "TaskItems",
                column: "OfferingId",
                principalTable: "CourseOfferings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_OrganizationPeriods_PeriodId",
                table: "TaskItems",
                column: "PeriodId",
                principalTable: "OrganizationPeriods",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_CourseOfferings_OfferingId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_Events_Groups_CohortGroupId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_Events_OrganizationPeriods_PeriodId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_CourseOfferings_OfferingId",
                table: "TaskItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_OrganizationPeriods_PeriodId",
                table: "TaskItems");

            migrationBuilder.DropTable(
                name: "OfferingEnrollments");

            migrationBuilder.DropTable(
                name: "CourseOfferings");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_OfferingId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_PeriodId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_Events_CohortGroupId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_OfferingId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_PeriodId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "OfferingId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "PeriodId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "AcademicYear",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "CohortGroupId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "OfferingId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "PeriodId",
                table: "Events");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Groups",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(40)",
                oldMaxLength: 40);

            migrationBuilder.AlterColumn<string>(
                name: "ScheduleConfig",
                table: "Groups",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Groups",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Groups",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()",
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");
        }
    }
}
