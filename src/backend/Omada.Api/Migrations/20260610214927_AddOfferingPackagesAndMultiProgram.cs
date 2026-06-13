using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferingPackagesAndMultiProgram : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourseOfferingPackages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferingPackages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackages_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CourseOfferingPrograms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProgramGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferingPrograms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPrograms_CourseOfferings_OfferingId",
                        column: x => x.OfferingId,
                        principalTable: "CourseOfferings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPrograms_Groups_ProgramGroupId",
                        column: x => x.ProgramGroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPrograms_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OfferingInstructors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferingInstructors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfferingInstructors_CourseOfferings_OfferingId",
                        column: x => x.OfferingId,
                        principalTable: "CourseOfferings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OfferingInstructors_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OfferingInstructors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CourseOfferingPackageItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PackageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    DefaultHostId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferingPackageItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackageItems_CourseOfferingPackages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "CourseOfferingPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackageItems_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackageItems_Users_DefaultHostId",
                        column: x => x.DefaultHostId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CourseOfferingPackagePrograms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PackageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProgramGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferingPackagePrograms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackagePrograms_CourseOfferingPackages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "CourseOfferingPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackagePrograms_Groups_ProgramGroupId",
                        column: x => x.ProgramGroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackagePrograms_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CourseOfferingPackageItemPrograms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PackageItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProgramGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseOfferingPackageItemPrograms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackageItemPrograms_CourseOfferingPackageItems_PackageItemId",
                        column: x => x.PackageItemId,
                        principalTable: "CourseOfferingPackageItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackageItemPrograms_Groups_ProgramGroupId",
                        column: x => x.ProgramGroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseOfferingPackageItemPrograms_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackageItemPrograms_OrganizationId",
                table: "CourseOfferingPackageItemPrograms",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackageItemPrograms_PackageItemId_ProgramGroupId",
                table: "CourseOfferingPackageItemPrograms",
                columns: new[] { "PackageItemId", "ProgramGroupId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackageItemPrograms_ProgramGroupId",
                table: "CourseOfferingPackageItemPrograms",
                column: "ProgramGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackageItems_DefaultHostId",
                table: "CourseOfferingPackageItems",
                column: "DefaultHostId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackageItems_OrganizationId",
                table: "CourseOfferingPackageItems",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackageItems_PackageId",
                table: "CourseOfferingPackageItems",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackagePrograms_OrganizationId",
                table: "CourseOfferingPackagePrograms",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackagePrograms_PackageId_ProgramGroupId",
                table: "CourseOfferingPackagePrograms",
                columns: new[] { "PackageId", "ProgramGroupId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackagePrograms_ProgramGroupId",
                table: "CourseOfferingPackagePrograms",
                column: "ProgramGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPackages_OrganizationId_Name",
                table: "CourseOfferingPackages",
                columns: new[] { "OrganizationId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPrograms_OfferingId_ProgramGroupId",
                table: "CourseOfferingPrograms",
                columns: new[] { "OfferingId", "ProgramGroupId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPrograms_OrganizationId",
                table: "CourseOfferingPrograms",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseOfferingPrograms_ProgramGroupId",
                table: "CourseOfferingPrograms",
                column: "ProgramGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferingInstructors_OfferingId_UserId",
                table: "OfferingInstructors",
                columns: new[] { "OfferingId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfferingInstructors_OrganizationId",
                table: "OfferingInstructors",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferingInstructors_UserId",
                table: "OfferingInstructors",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseOfferingPackageItemPrograms");

            migrationBuilder.DropTable(
                name: "CourseOfferingPackagePrograms");

            migrationBuilder.DropTable(
                name: "CourseOfferingPrograms");

            migrationBuilder.DropTable(
                name: "OfferingInstructors");

            migrationBuilder.DropTable(
                name: "CourseOfferingPackageItems");

            migrationBuilder.DropTable(
                name: "CourseOfferingPackages");
        }
    }
}
