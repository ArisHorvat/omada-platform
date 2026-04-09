using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class ScrapedClassEventConfiguration : IEntityTypeConfiguration<ScrapedClassEvent>
{
    public void Configure(EntityTypeBuilder<ScrapedClassEvent> builder)
    {
        builder.ToTable("ScrapedClassEvents");

        builder.Property(e => e.ClassName).IsRequired().HasMaxLength(500);
        builder.Property(e => e.Time).IsRequired().HasMaxLength(200);
        builder.Property(e => e.RoomText).HasColumnName("Room").IsRequired().HasMaxLength(200);
        builder.Property(e => e.Professor).IsRequired().HasMaxLength(200);
        builder.Property(e => e.GroupNumber).IsRequired().HasMaxLength(100);
        builder.Property(e => e.DataHash).IsRequired().HasMaxLength(128);

        builder.HasIndex(e => new { e.OrganizationId, e.DataHash });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Host)
            .WithMany()
            .HasForeignKey(e => e.HostId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
