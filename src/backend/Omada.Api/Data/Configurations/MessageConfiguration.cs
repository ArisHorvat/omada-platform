using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Omada.Api.Entities;

namespace Omada.Api.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");

        // 1. 🚀 Global Filter (Soft Deletes)
        // Soft-delete + tenant filter applied in ApplicationDbContext

        // 2. Properties
        builder.Property(m => m.Content)
               .IsRequired()
               .HasMaxLength(2000); // Limit message size

        builder.Property(m => m.UserName)
               .HasMaxLength(100);

        // 3. 🚀 Relationships (Use Restrict to prevent cycles)
        
        // Link to Organization
        builder.HasOne(m => m.Organization)
               .WithMany() // Assuming Org doesn't have a 'Messages' collection, or use .WithMany(o => o.Messages)
               .HasForeignKey(m => m.OrganizationId)
               .OnDelete(DeleteBehavior.Restrict); // STOP SQL CASCADE

        // Link to User (Author)
        builder.HasOne(m => m.User)
               .WithMany()
               .HasForeignKey(m => m.UserId)
               .OnDelete(DeleteBehavior.Restrict); // STOP SQL CASCADE
    }
}