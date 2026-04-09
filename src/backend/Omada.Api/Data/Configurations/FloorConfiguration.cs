using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class FloorConfiguration : IEntityTypeConfiguration<Floor>
{
    public void Configure(EntityTypeBuilder<Floor> builder)
    {
        builder.ToTable("Floors");

        builder.Property(f => f.FloorplanImageUrl).HasMaxLength(2048);

        builder.HasIndex(f => new { f.BuildingId, f.LevelNumber }).IsUnique();

        // Restrict (NO ACTION): SQL Server forbids multiple cascade paths when Rooms also link Building
        // and Floor (Building→Floor cascade + Room FKs caused error 1785). Delete floors in app before building.
        builder.HasOne(f => f.Building)
            .WithMany(b => b.Floors)
            .HasForeignKey(f => f.BuildingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
