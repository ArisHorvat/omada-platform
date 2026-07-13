using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class AnnouncementPostConfiguration : IEntityTypeConfiguration<AnnouncementPost>
{
    public void Configure(EntityTypeBuilder<AnnouncementPost> builder)
    {
        builder.ToTable("AnnouncementPosts");

        builder.Property(p => p.Title)
            .HasMaxLength(300);

        builder.Property(p => p.Content)
            .IsRequired()
            .HasMaxLength(8000);

        builder.HasIndex(p => new { p.ChannelId, p.CreatedAt });

        builder.HasOne(p => p.Organization)
            .WithMany()
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Channel)
            .WithMany(c => c.Posts)
            .HasForeignKey(p => p.ChannelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Author)
            .WithMany()
            .HasForeignKey(p => p.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
