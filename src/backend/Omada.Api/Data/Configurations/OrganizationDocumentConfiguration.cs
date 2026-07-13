using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Configurations;

public class OrganizationDocumentConfiguration : IEntityTypeConfiguration<OrganizationDocument>
{
    public void Configure(EntityTypeBuilder<OrganizationDocument> builder)
    {
        builder.ToTable("OrganizationDocuments");

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.OriginalFileName)
            .IsRequired()
            .HasMaxLength(260);

        builder.Property(e => e.ContentType)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(e => e.StorageRelativePath)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(32)
            .HasDefaultValue(DocumentCategories.General);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.HasIndex(e => new { e.OrganizationId, e.Category });
        builder.HasIndex(e => new { e.OrganizationId, e.CreatedAt });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.UploadedBy)
            .WithMany()
            .HasForeignKey(e => e.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
