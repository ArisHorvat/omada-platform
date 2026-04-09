using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasQueryFilter(rt => !rt.IsDeleted);
        builder.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
    }
}