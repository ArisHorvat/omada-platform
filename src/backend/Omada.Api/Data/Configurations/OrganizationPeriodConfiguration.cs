using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class OrganizationPeriodConfiguration : IEntityTypeConfiguration<OrganizationPeriod>
{
    public void Configure(EntityTypeBuilder<OrganizationPeriod> builder)
    {
        builder.ToTable("OrganizationPeriods");

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasIndex(e => new { e.OrganizationId, e.Name });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
