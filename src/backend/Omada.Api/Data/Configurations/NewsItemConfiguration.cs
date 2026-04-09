using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class NewsItemConfiguration : IEntityTypeConfiguration<NewsItem>
{
    public void Configure(EntityTypeBuilder<NewsItem> builder)
    {
        builder.ToTable("News");

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Content)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(e => e.CoverImageUrl)
            .HasMaxLength(1024);

        builder.Property(e => e.Type).HasConversion<int>();
        builder.Property(e => e.Category).HasConversion<int>()
            .HasDefaultValue(NewsCategory.General);

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Avoid SQL Server multiple cascade paths (User -> NewsItem and User -> UserNewsRead).
        builder.HasOne(e => e.Author)
            .WithMany()
            .HasForeignKey(e => e.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
