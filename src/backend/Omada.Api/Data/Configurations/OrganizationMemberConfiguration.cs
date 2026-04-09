using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class OrganizationMemberConfiguration : IEntityTypeConfiguration<OrganizationMember>
{
    public void Configure(EntityTypeBuilder<OrganizationMember> builder)
    {
        // Composite Key
        builder.HasKey(om => new { om.OrganizationId, om.UserId });

        // Relationship Rule
        builder.HasOne(om => om.Role)
               .WithMany(r => r.Members)
               .HasForeignKey(om => om.RoleId)
               .OnDelete(DeleteBehavior.Restrict); 
    }
}