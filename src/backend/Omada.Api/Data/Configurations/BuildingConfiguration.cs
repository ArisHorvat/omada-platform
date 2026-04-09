using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class BuildingConfiguration : IEntityTypeConfiguration<Building>
{
    public void Configure(EntityTypeBuilder<Building> builder)
    {
        builder.ToTable("Buildings");
        // Soft-delete + tenant filter applied in ApplicationDbContext

        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ShortCode).HasMaxLength(10);

        // Prevent Cascade Delete from Org
        builder.HasOne(b => b.Organization)
               .WithMany()
               .HasForeignKey(b => b.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}