using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class MapRoomsFloorsPinsBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "CoordinateX",
                table: "Rooms",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CoordinateY",
                table: "Rooms",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomAttributes",
                table: "Rooms",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FloorId",
                table: "Rooms",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RequiredRoleId",
                table: "Rooms",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Floors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuildingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LevelNumber = table.Column<int>(type: "int", nullable: false),
                    FloorplanImageUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Floors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Floors_Buildings_BuildingId",
                        column: x => x.BuildingId,
                        principalTable: "Buildings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomBookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomBookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomBookings_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomBookings_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomBookings_Users_BookedByUserId",
                        column: x => x.BookedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MapPins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FloorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PinType = table.Column<byte>(type: "tinyint", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CoordinateX = table.Column<double>(type: "float", nullable: false),
                    CoordinateY = table.Column<double>(type: "float", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapPins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapPins_Floors_FloorId",
                        column: x => x.FloorId,
                        principalTable: "Floors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_MapPins_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_FloorId",
                table: "Rooms",
                column: "FloorId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_RequiredRoleId",
                table: "Rooms",
                column: "RequiredRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Floors_BuildingId_LevelNumber",
                table: "Floors",
                columns: new[] { "BuildingId", "LevelNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MapPins_FloorId",
                table: "MapPins",
                column: "FloorId");

            migrationBuilder.CreateIndex(
                name: "IX_MapPins_RoomId",
                table: "MapPins",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBookings_BookedByUserId",
                table: "RoomBookings",
                column: "BookedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBookings_OrganizationId",
                table: "RoomBookings",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBookings_RoomId_StartUtc_EndUtc",
                table: "RoomBookings",
                columns: new[] { "RoomId", "StartUtc", "EndUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_Rooms_Floors_FloorId",
                table: "Rooms",
                column: "FloorId",
                principalTable: "Floors",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Rooms_Roles_RequiredRoleId",
                table: "Rooms",
                column: "RequiredRoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rooms_Floors_FloorId",
                table: "Rooms");

            migrationBuilder.DropForeignKey(
                name: "FK_Rooms_Roles_RequiredRoleId",
                table: "Rooms");

            migrationBuilder.DropTable(
                name: "MapPins");

            migrationBuilder.DropTable(
                name: "RoomBookings");

            migrationBuilder.DropTable(
                name: "Floors");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_FloorId",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_RequiredRoleId",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "CoordinateX",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "CoordinateY",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "CustomAttributes",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "FloorId",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "RequiredRoleId",
                table: "Rooms");
        }
    }
}
