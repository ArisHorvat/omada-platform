using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class UserProfilePreferencesAndGdpr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "Users",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublicInDirectory",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "LanguagePreference",
                table: "Users",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "en");

            migrationBuilder.AddColumn<string>(
                name: "PreferencesJson",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThemePreference",
                table: "Users",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "system");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bio",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPublicInDirectory",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LanguagePreference",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreferencesJson",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ThemePreference",
                table: "Users");
        }
    }
}
