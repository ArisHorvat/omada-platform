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
        builder.Property(o => o.InviteCode).IsRequired().HasMaxLength(16);
        builder.HasIndex(o => o.InviteCode).IsUnique();
        builder.Property(o => o.OrganizationType).HasConversion<byte>();
        builder.Property(o => o.SpiderSchedulePageUrl).HasMaxLength(2048);
        builder.Property(o => o.SpiderNewsStartUrl).HasMaxLength(2048);
        builder.Property(o => o.EnabledWidgetKeysJson).HasMaxLength(4000);
        builder.Property(o => o.OnboardingCompletedStepsJson).HasMaxLength(2000);
    }
}