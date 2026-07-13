using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class AnnouncementCommentConfiguration : IEntityTypeConfiguration<AnnouncementComment>
{
    public void Configure(EntityTypeBuilder<AnnouncementComment> builder)
    {
        builder.ToTable("AnnouncementComments");

        builder.Property(c => c.Content)
            .IsRequired()
            .HasMaxLength(2000);

        builder.HasIndex(c => new { c.PostId, c.CreatedAt });

        builder.HasOne(c => c.Organization)
            .WithMany()
            .HasForeignKey(c => c.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Post)
            .WithMany()
            .HasForeignKey(c => c.PostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
