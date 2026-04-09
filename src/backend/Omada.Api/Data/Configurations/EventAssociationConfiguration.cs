using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class EventAssociationConfiguration : IEntityTypeConfiguration<EventAssociation>
{
    public void Configure(EntityTypeBuilder<EventAssociation> builder)
    {
        builder.ToTable("EventAssociations");

        // Soft-delete + tenant filter (via Event.OrganizationId) in ApplicationDbContext

        // Unique Index to prevent duplicates
        builder.HasIndex(ea => new { ea.EventId, ea.EntityId, ea.EntityType }).IsUnique();

        builder.Property(e => e.EntityType).HasConversion<int>();

        builder.HasOne(ea => ea.Event)
               .WithMany(e => e.Associations)
               .HasForeignKey(ea => ea.EventId)
               .OnDelete(DeleteBehavior.Cascade); 
    }
}