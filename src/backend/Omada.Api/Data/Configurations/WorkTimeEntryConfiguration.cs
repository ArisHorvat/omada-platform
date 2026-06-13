using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class WorkTimeEntryConfiguration : IEntityTypeConfiguration<WorkTimeEntry>
{
    public void Configure(EntityTypeBuilder<WorkTimeEntry> builder)
    {
        builder.ToTable("WorkTimeEntries");

        builder.HasIndex(e => new { e.OrganizationId, e.UserId, e.WorkDate }).IsUnique();

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
