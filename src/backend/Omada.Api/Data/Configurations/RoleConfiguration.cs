using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        // Soft-delete + tenant filter applied in ApplicationDbContext

        builder.Property(r => r.Name).IsRequired().HasMaxLength(50);
        
        // 2. 🚀 Stop SQL Cascade: Deleting an Org shouldn't auto-delete roles via SQL
        builder.HasOne(r => r.Organization)
               .WithMany(o => o.Roles)
               .HasForeignKey(r => r.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict); 
    }
}