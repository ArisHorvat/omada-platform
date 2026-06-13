using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("TaskItems");

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasMaxLength(4000);

        builder.Property(t => t.IsCompleted)
            .IsRequired();

        builder.Property(t => t.Priority)
            .HasConversion<byte>();

        builder.Property(t => t.Weight)
            .HasPrecision(6, 4);

        builder.Property(t => t.ReferenceUrl)
            .HasMaxLength(2048);

        builder.Property(t => t.MaterialsJson)
            .HasMaxLength(8000);

        builder.Property(t => t.SubmissionUrl)
            .HasMaxLength(2048);

        builder.Property(t => t.SubmissionAttachmentsJson)
            .HasMaxLength(8000);

        builder.Property(t => t.TeacherFeedback)
            .HasMaxLength(4000);

        builder.HasOne(t => t.Organization)
            .WithMany()
            .HasForeignKey(t => t.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Assignee)
            .WithMany()
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Creator)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Period)
            .WithMany()
            .HasForeignKey(t => t.PeriodId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Offering)
            .WithMany()
            .HasForeignKey(t => t.OfferingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.GradeCategory)
            .WithMany()
            .HasForeignKey(t => t.GradeCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.OrganizationId, t.AssignmentBatchId })
            .HasFilter("[AssignmentBatchId] IS NOT NULL AND [IsDeleted] = 0");
    }
}
