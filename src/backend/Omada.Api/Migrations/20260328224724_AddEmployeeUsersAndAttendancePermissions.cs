using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Omada.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeUsersAndAttendancePermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Employee role: allow schedule status (users:view) and attendance actions missed in early seeds.
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
  INSERT INTO RolePermissions (RoleId, WidgetKey, AccessLevel)
  SELECT r.Id, N'users', CAST(0 AS tinyint)
  FROM Roles r
  WHERE r.Name = N'Employee'
  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleId = r.Id AND rp.WidgetKey = N'users');

  INSERT INTO RolePermissions (RoleId, WidgetKey, AccessLevel)
  SELECT r.Id, N'attendance', CAST(1 AS tinyint)
  FROM Roles r
  WHERE r.Name = N'Employee'
  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleId = r.Id AND rp.WidgetKey = N'attendance');
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE rp FROM RolePermissions rp
INNER JOIN Roles r ON r.Id = rp.RoleId
WHERE r.Name = N'Employee' AND rp.WidgetKey IN (N'users', N'attendance');
");
        }
    }
}
