using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAnnouncementChannelReads : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserAnnouncementChannelReads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChannelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LastReadAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAnnouncementChannelReads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAnnouncementChannelReads_AnnouncementChannels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "AnnouncementChannels",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserAnnouncementChannelReads_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserAnnouncementChannelReads_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAnnouncementChannelReads_ChannelId",
                table: "UserAnnouncementChannelReads",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAnnouncementChannelReads_OrganizationId",
                table: "UserAnnouncementChannelReads",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAnnouncementChannelReads_UserId_ChannelId",
                table: "UserAnnouncementChannelReads",
                columns: new[] { "UserId", "ChannelId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserAnnouncementChannelReads");
        }
    }
}
