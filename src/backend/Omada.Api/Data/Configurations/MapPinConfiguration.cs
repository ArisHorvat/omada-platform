using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class MapPinConfiguration : IEntityTypeConfiguration<MapPin>
{
    public void Configure(EntityTypeBuilder<MapPin> builder)
    {
        builder.ToTable("MapPins");

        builder.Property(p => p.PinType).HasConversion<byte>();
        builder.Property(p => p.Label).HasMaxLength(200);

        // SQL Server forbids multiple cascade paths (Floor→MapPin→Room and Floor→Room). Use NoAction;
        // delete pins in application code or rely on soft-delete when removing a floor.
        builder.HasOne(p => p.Floor)
            .WithMany(f => f.MapPins)
            .HasForeignKey(p => p.FloorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(p => p.Room)
            .WithMany(r => r.MapPins)
            .HasForeignKey(p => p.RoomId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
