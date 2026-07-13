using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnnouncementComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementComments_AnnouncementPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "AnnouncementPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementComments_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnnouncementComments_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComments_AuthorId",
                table: "AnnouncementComments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComments_OrganizationId",
                table: "AnnouncementComments",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementComments_PostId_CreatedAt",
                table: "AnnouncementComments",
                columns: new[] { "PostId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementComments");
        }
    }
}
