using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("Events");

        builder.Property(e => e.Title).IsRequired().HasMaxLength(150);
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.ColorHex).HasMaxLength(10);
        builder.Property(e => e.RecurrenceRule).HasMaxLength(500);
        builder.Property(e => e.MaxCapacity);

        builder.HasOne(e => e.Organization)
            .WithMany(o => o.Events)
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.EventType)
            .WithMany()
            .HasForeignKey(e => e.EventTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Host)
            .WithMany()
            .HasForeignKey(e => e.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Group)
            .WithMany()
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
