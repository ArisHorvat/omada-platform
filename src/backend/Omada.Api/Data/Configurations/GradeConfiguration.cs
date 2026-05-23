using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.ToTable("Grades");

        builder.Property(g => g.CourseName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(g => g.Semester)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(g => g.LetterGrade)
            .HasMaxLength(8);

        builder.Property(g => g.Score)
            .HasPrecision(6, 2);

        builder.Property(g => g.Credits)
            .HasPrecision(6, 2);

        builder.HasOne(g => g.Organization)
            .WithMany()
            .HasForeignKey(g => g.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.User)
            .WithMany()
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.Group)
            .WithMany()
            .HasForeignKey(g => g.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(g => g.GroupId);

        builder.HasIndex(g => new { g.OrganizationId, g.UserId, g.Semester, g.CourseName });
    }
}
