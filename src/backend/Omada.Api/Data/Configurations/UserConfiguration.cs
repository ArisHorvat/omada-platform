using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        // 1. 🚀 Global Filter
        builder.HasQueryFilter(u => !u.IsDeleted);

        builder.Property(u => u.Email).IsRequired().HasMaxLength(200);
        builder.Property(u => u.ThemePreference).HasMaxLength(32).HasDefaultValue("system");
        builder.Property(u => u.LanguagePreference).HasMaxLength(16).HasDefaultValue("en");
        builder.Property(u => u.Title).HasMaxLength(150);
        builder.Property(u => u.DepartmentId);
        builder.Property(u => u.Bio).HasMaxLength(2000);
        builder.Property(u => u.PreferencesJson).HasColumnType("nvarchar(max)");

        // Org chart: self-referencing manager relationship.
        builder.HasOne(u => u.Manager)
            .WithMany(u => u.DirectReports)
            .HasForeignKey(u => u.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}