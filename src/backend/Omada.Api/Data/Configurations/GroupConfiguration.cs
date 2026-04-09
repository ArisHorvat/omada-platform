using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        // Soft-delete + tenant filter applied in ApplicationDbContext

        builder.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        // Ensure this link exists and is Restricted
        builder.HasOne(g => g.Organization)
               .WithMany() 
               .HasForeignKey(g => g.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}