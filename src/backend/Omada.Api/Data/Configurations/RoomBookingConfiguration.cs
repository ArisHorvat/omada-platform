using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class RoomBookingConfiguration : IEntityTypeConfiguration<RoomBooking>
{
    public void Configure(EntityTypeBuilder<RoomBooking> builder)
    {
        builder.ToTable("RoomBookings");

        builder.Property(b => b.Notes).HasMaxLength(2000);

        builder.HasIndex(b => new { b.RoomId, b.StartUtc, b.EndUtc });

        builder.HasOne(b => b.Room)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.BookedBy)
            .WithMany()
            .HasForeignKey(b => b.BookedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(b => b.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
