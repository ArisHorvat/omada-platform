using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class UserNewsReadConfiguration : IEntityTypeConfiguration<UserNewsRead>
{
    public void Configure(EntityTypeBuilder<UserNewsRead> builder)
    {
        builder.ToTable("UserNewsReads");

        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.NewsItemId }).IsUnique();

        builder.Property(x => x.ReadAt)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.NewsItem)
            .WithMany()
            .HasForeignKey(x => x.NewsItemId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
