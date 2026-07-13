using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Data.Configurations;

public class UserAnnouncementChannelReadConfiguration : IEntityTypeConfiguration<UserAnnouncementChannelRead>
{
    public void Configure(EntityTypeBuilder<UserAnnouncementChannelRead> builder)
    {
        builder.ToTable("UserAnnouncementChannelReads");

        builder.HasIndex(x => new { x.UserId, x.ChannelId }).IsUnique();

        builder.Property(x => x.LastReadAt).IsRequired();

        builder.HasOne(x => x.Organization)
            .WithMany()
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.Channel)
            .WithMany()
            .HasForeignKey(x => x.ChannelId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
