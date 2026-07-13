using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class CourseOfferingPackageConfiguration : IEntityTypeConfiguration<CourseOfferingPackage>
{
    public void Configure(EntityTypeBuilder<CourseOfferingPackage> builder)
    {
        builder.ToTable("CourseOfferingPackages");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.HasIndex(e => new { e.OrganizationId, e.Name });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CourseOfferingPackageItemConfiguration : IEntityTypeConfiguration<CourseOfferingPackageItem>
{
    public void Configure(EntityTypeBuilder<CourseOfferingPackageItem> builder)
    {
        builder.ToTable("CourseOfferingPackageItems");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Code).HasMaxLength(40);
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.Credits).HasPrecision(5, 2);
        builder.Property(e => e.InstructorsJson).HasMaxLength(4000);
        builder.Property(e => e.WeeklySessionPlanJson).HasMaxLength(8000);

        builder.HasOne(e => e.Organization).WithMany().HasForeignKey(e => e.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Package).WithMany(p => p.Items).HasForeignKey(e => e.PackageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.DefaultHost).WithMany().HasForeignKey(e => e.DefaultHostId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class CourseOfferingPackageProgramConfiguration : IEntityTypeConfiguration<CourseOfferingPackageProgram>
{
    public void Configure(EntityTypeBuilder<CourseOfferingPackageProgram> builder)
    {
        builder.ToTable("CourseOfferingPackagePrograms");
        builder.HasIndex(e => new { e.PackageId, e.ProgramGroupId }).IsUnique();

        builder.HasOne(e => e.Organization).WithMany().HasForeignKey(e => e.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Package).WithMany(p => p.Programs).HasForeignKey(e => e.PackageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.ProgramGroup).WithMany().HasForeignKey(e => e.ProgramGroupId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class CourseOfferingPackageItemProgramConfiguration : IEntityTypeConfiguration<CourseOfferingPackageItemProgram>
{
    public void Configure(EntityTypeBuilder<CourseOfferingPackageItemProgram> builder)
    {
        builder.ToTable("CourseOfferingPackageItemPrograms");
        builder.HasIndex(e => new { e.PackageItemId, e.ProgramGroupId }).IsUnique();

        builder.HasOne(e => e.Organization).WithMany().HasForeignKey(e => e.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.PackageItem).WithMany(i => i.Programs).HasForeignKey(e => e.PackageItemId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.ProgramGroup).WithMany().HasForeignKey(e => e.ProgramGroupId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class CourseOfferingProgramConfiguration : IEntityTypeConfiguration<CourseOfferingProgram>
{
    public void Configure(EntityTypeBuilder<CourseOfferingProgram> builder)
    {
        builder.ToTable("CourseOfferingPrograms");
        builder.HasIndex(e => new { e.OfferingId, e.ProgramGroupId }).IsUnique();

        builder.HasOne(e => e.Organization).WithMany().HasForeignKey(e => e.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Offering).WithMany(o => o.Programs).HasForeignKey(e => e.OfferingId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.ProgramGroup).WithMany().HasForeignKey(e => e.ProgramGroupId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class OfferingInstructorConfiguration : IEntityTypeConfiguration<OfferingInstructor>
{
    public void Configure(EntityTypeBuilder<OfferingInstructor> builder)
    {
        builder.ToTable("OfferingInstructors");
        builder.Property(e => e.Role).IsRequired().HasMaxLength(32);
        builder.HasIndex(e => new { e.OfferingId, e.UserId }).IsUnique();

        builder.HasOne(e => e.Organization).WithMany().HasForeignKey(e => e.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Offering).WithMany(o => o.Instructors).HasForeignKey(e => e.OfferingId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
