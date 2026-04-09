using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasQueryFilter(o => !o.IsDeleted);

        builder.Property(o => o.Name).IsRequired().HasMaxLength(100);
        builder.Property(o => o.OrganizationType).HasConversion<byte>();
    }
}