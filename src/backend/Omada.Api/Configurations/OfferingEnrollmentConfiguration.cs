using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class OfferingEnrollmentConfiguration : IEntityTypeConfiguration<OfferingEnrollment>
{
    public void Configure(EntityTypeBuilder<OfferingEnrollment> builder)
    {
        builder.ToTable("OfferingEnrollments");

        builder.HasIndex(e => new { e.OfferingId, e.UserId }).IsUnique();

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Offering)
            .WithMany(o => o.Enrollments)
            .HasForeignKey(e => e.OfferingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.CohortGroup)
            .WithMany()
            .HasForeignKey(e => e.CohortGroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
