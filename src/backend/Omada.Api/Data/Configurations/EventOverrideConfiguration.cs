using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class EventOverrideConfiguration : IEntityTypeConfiguration<EventOverride>
{
    public void Configure(EntityTypeBuilder<EventOverride> builder)
    {
        builder.ToTable("EventOverrides");

        // Soft-delete + tenant filter (via Event.OrganizationId) in ApplicationDbContext

        builder.HasOne(e => e.Event)
               .WithMany(e => e.Overrides)
               .HasForeignKey(e => e.EventId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}