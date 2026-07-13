using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.Entities;

namespace Omada.Api.Tests.Infrastructure;

internal sealed class FixedTenantAccessor : ITenantAccessor
{
    public FixedTenantAccessor(Guid? organizationId) => CurrentOrganizationId = organizationId;

    public Guid? CurrentOrganizationId { get; }
}

internal sealed class FixedUserContext : IUserContext
{
    public FixedUserContext(Guid userId, Guid organizationId)
    {
        UserId = userId;
        OrganizationId = organizationId;
    }

    public Guid UserId { get; }
    public Guid OrganizationId { get; }
}

internal static class TestDb
{
    public static ApplicationDbContext CreateContext(string databaseName, Guid? organizationId)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new ApplicationDbContext(options, new FixedTenantAccessor(organizationId));
    }

    public static async Task<(Guid OrgId, Guid UserId, Guid RoomId)> SeedBookableRoomAsync(ApplicationDbContext context)
    {
        var orgId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var roomId = Guid.NewGuid();

        context.Organizations.Add(new Organization
        {
            Id = orgId,
            Name = "Test Org",
            EmailDomain = "test.local",
            InviteCode = "TESTORG",
        });

        context.Users.Add(new User
        {
            Id = userId,
            FirstName = "Test",
            LastName = "User",
            Email = "tester@test.local",
            PasswordHash = "hash",
        });

        context.Rooms.Add(new Room
        {
            Id = roomId,
            OrganizationId = orgId,
            Name = "Board Room",
            Capacity = 12,
            IsBookable = true,
        });

        await context.SaveChangesAsync();
        return (orgId, userId, roomId);
    }
}
