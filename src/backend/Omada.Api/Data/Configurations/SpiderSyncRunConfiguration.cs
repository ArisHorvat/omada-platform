using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class SpiderSyncRunConfiguration : IEntityTypeConfiguration<SpiderSyncRun>
{
    public void Configure(EntityTypeBuilder<SpiderSyncRun> builder)
    {
        builder.ToTable("SpiderSyncRuns");

        builder.Property(e => e.ErrorMessage).HasMaxLength(2000);
        builder.Property(e => e.HangfireJobId).HasMaxLength(128);
        builder.Property(e => e.Kind).HasConversion<int>();
        builder.Property(e => e.Status).HasConversion<int>();

        builder.HasIndex(e => new { e.OrganizationId, e.StartedAt });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
