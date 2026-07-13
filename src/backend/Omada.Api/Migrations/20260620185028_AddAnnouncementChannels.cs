using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementChannels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnnouncementChannels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kind = table.Column<byte>(type: "tinyint", nullable: false),
                    GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CourseOfferingId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementChannels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementChannels_CourseOfferings_CourseOfferingId",
                        column: x => x.CourseOfferingId,
                        principalTable: "CourseOfferings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementChannels_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementChannels_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChannelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementPosts_AnnouncementChannels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "AnnouncementChannels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementPosts_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementPosts_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementChannels_CourseOfferingId",
                table: "AnnouncementChannels",
                column: "CourseOfferingId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementChannels_GroupId",
                table: "AnnouncementChannels",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementChannels_OrganizationId_CourseOfferingId",
                table: "AnnouncementChannels",
                columns: new[] { "OrganizationId", "CourseOfferingId" },
                unique: true,
                filter: "[CourseOfferingId] IS NOT NULL AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementChannels_OrganizationId_GroupId",
                table: "AnnouncementChannels",
                columns: new[] { "OrganizationId", "GroupId" },
                unique: true,
                filter: "[GroupId] IS NOT NULL AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementChannels_OrganizationId_Kind",
                table: "AnnouncementChannels",
                columns: new[] { "OrganizationId", "Kind" },
                unique: true,
                filter: "[Kind] = 0 AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementPosts_AuthorId",
                table: "AnnouncementPosts",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementPosts_ChannelId_CreatedAt",
                table: "AnnouncementPosts",
                columns: new[] { "ChannelId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementPosts_OrganizationId",
                table: "AnnouncementPosts",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementPosts");

            migrationBuilder.DropTable(
                name: "AnnouncementChannels");
        }
    }
}
