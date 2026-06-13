using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class OfferingGradeCategoryConfiguration : IEntityTypeConfiguration<OfferingGradeCategory>
{
    public void Configure(EntityTypeBuilder<OfferingGradeCategory> builder)
    {
        builder.ToTable("OfferingGradeCategories");

        builder.Property(e => e.Name).IsRequired().HasMaxLength(120);
        builder.Property(e => e.Weight).HasPrecision(6, 4);

        builder.HasIndex(e => new { e.OfferingId, e.SortOrder });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Offering)
            .WithMany()
            .HasForeignKey(e => e.OfferingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
