using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class FloorplanConfiguration : IEntityTypeConfiguration<Floorplan>
{
    public void Configure(EntityTypeBuilder<Floorplan> builder)
    {
        builder.ToTable("Floorplans");

        builder.Property(p => p.ImageUrl).HasMaxLength(2048);
        builder.Property(p => p.GeoJsonData).HasColumnType("nvarchar(max)");

        builder.HasIndex(p => p.FloorId).IsUnique();

        builder.HasOne(p => p.Floor)
            .WithOne(f => f.Floorplan)
            .HasForeignKey<Floorplan>(p => p.FloorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
