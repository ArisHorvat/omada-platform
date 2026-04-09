using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class EventTypeConfiguration : IEntityTypeConfiguration<EventType>
{
    public void Configure(EntityTypeBuilder<EventType> builder)
    {
        builder.ToTable("EventTypes");
        builder.Property(x => x.Name).IsRequired().HasMaxLength(50);
        builder.Property(x => x.ColorHex).HasMaxLength(10);

        // Soft-delete + tenant filter applied in ApplicationDbContext

        // 2. 🚀 STOP CASCADE FROM ORGANIZATION
        builder.HasOne<Organization>()
               .WithMany()
               .HasForeignKey(x => x.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict); // Was Cascade
    }
}