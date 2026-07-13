using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class CourseOfferingConfiguration : IEntityTypeConfiguration<CourseOffering>
{
    public void Configure(EntityTypeBuilder<CourseOffering> builder)
    {
        builder.ToTable("CourseOfferings");

        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Code).HasMaxLength(40);
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.WeeklySessionPlanJson).HasMaxLength(8000);
        builder.Property(e => e.Credits).HasPrecision(6, 2);
        builder.Property(e => e.RequiredAttendancePercent).HasPrecision(5, 2);
        builder.Property(e => e.TimetablePublishedEventIdsJson).HasMaxLength(4000);
        builder.Property(e => e.TimetablePublishedPlanJson).HasMaxLength(8000);

        builder.HasIndex(e => new { e.OrganizationId, e.PeriodId, e.Name });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Period)
            .WithMany()
            .HasForeignKey(e => e.PeriodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ProgramGroup)
            .WithMany()
            .HasForeignKey(e => e.ProgramGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.SubjectCatalogGroup)
            .WithMany()
            .HasForeignKey(e => e.SubjectCatalogGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Host)
            .WithMany()
            .HasForeignKey(e => e.HostId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
