using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.ToTable("Rooms");
        builder.Property(r => r.Name).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Location).HasMaxLength(200);
        builder.Property(r => r.Resources).HasMaxLength(500);
        builder.Property(r => r.CustomAttributes).HasColumnType("nvarchar(max)");
        builder.Property(r => r.AmenitiesJson).HasColumnType("nvarchar(max)");

        // Organization Cascade (Keep this)
        // 1. 🚀 ADD GLOBAL FILTER
        // Soft-delete + tenant filter applied in ApplicationDbContext

        // 2. 🚀 STOP CASCADE FROM ORGANIZATION
        builder.HasOne<Organization>()
               .WithMany()
               .HasForeignKey(r => r.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict); // Was Cascade

        builder.HasOne(r => r.Building)
                .WithMany(b => b.Rooms)
                .HasForeignKey(r => r.BuildingId)
                .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(r => r.Floor)
            .WithMany(f => f.Rooms)
            .HasForeignKey(r => r.FloorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(r => r.RequiredRole)
            .WithMany()
            .HasForeignKey(r => r.RequiredRoleId)
            .OnDelete(DeleteBehavior.SetNull);

        // 3. 🚀 SIMPLIFY THE JOIN TABLE (Revert the complex fix from before)
        // Since we stopped the root cascade, standard Many-to-Many is safe now.
        builder.HasMany(r => r.AllowedEventTypes)
               .WithMany(et => et.SupportedRooms)
               .UsingEntity(j => j.ToTable("RoomAllowedEventTypes"));
    }
}