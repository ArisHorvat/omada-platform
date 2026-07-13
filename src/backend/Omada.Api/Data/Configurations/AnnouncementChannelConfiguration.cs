using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class AnnouncementChannelConfiguration : IEntityTypeConfiguration<AnnouncementChannel>
{
    public void Configure(EntityTypeBuilder<AnnouncementChannel> builder)
    {
        builder.ToTable("AnnouncementChannels");

        builder.Property(c => c.DisplayName)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(c => new { c.OrganizationId, c.Kind })
            .HasFilter("[Kind] = 0 AND [IsDeleted] = 0")
            .IsUnique();

        builder.HasIndex(c => new { c.OrganizationId, c.GroupId })
            .HasFilter("[GroupId] IS NOT NULL AND [IsDeleted] = 0")
            .IsUnique();

        builder.HasIndex(c => new { c.OrganizationId, c.CourseOfferingId })
            .HasFilter("[CourseOfferingId] IS NOT NULL AND [IsDeleted] = 0")
            .IsUnique();

        builder.HasOne(c => c.Organization)
            .WithMany()
            .HasForeignKey(c => c.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Group)
            .WithMany()
            .HasForeignKey(c => c.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.CourseOffering)
            .WithMany()
            .HasForeignKey(c => c.CourseOfferingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
