using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class EventAttendanceConfiguration : IEntityTypeConfiguration<EventAttendance>
{
    public void Configure(EntityTypeBuilder<EventAttendance> builder)
    {
        builder.ToTable("EventAttendances");
        // Soft-delete + tenant filter (via Event.OrganizationId) in ApplicationDbContext

        builder.HasOne(e => e.Event)
               .WithMany(e => e.Attendances)
               .HasForeignKey(e => e.EventId)
               .OnDelete(DeleteBehavior.Cascade); // If event deleted, delete attendance

        builder.HasOne(e => e.User)
               .WithMany()
               .HasForeignKey(e => e.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}