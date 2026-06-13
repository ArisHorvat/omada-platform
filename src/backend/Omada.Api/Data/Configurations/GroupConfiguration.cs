using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        // Soft-delete + tenant filter applied in ApplicationDbContext

        builder.Property(g => g.Name).IsRequired().HasMaxLength(200);
        builder.Property(g => g.Type).IsRequired().HasMaxLength(40);
        builder.Property(g => g.AcademicYear).HasMaxLength(20);
        builder.Property(g => g.ScheduleConfig).HasMaxLength(4000);

        // Ensure this link exists and is Restricted
        builder.HasOne(g => g.Organization)
               .WithMany() 
               .HasForeignKey(g => g.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}