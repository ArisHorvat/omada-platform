using Omada.Api.Entities;
using Omada.Api.Tests.Infrastructure;

namespace Omada.Api.Tests.Tenancy;

/// <summary>
/// Thesis verification: multi-tenant isolation at the ORM filter layer.
/// </summary>
public class TenantIsolationTests
{
    [Fact]
    public async Task RoomQuery_ReturnsOnlyCurrentOrganizationRows()
    {
        var dbName = Guid.NewGuid().ToString();
        var orgA = Guid.NewGuid();
        var orgB = Guid.NewGuid();

        await using (var seed = TestDb.CreateContext(dbName, organizationId: null))
        {
            seed.Organizations.AddRange(
                new Organization { Id = orgA, Name = "Org A", EmailDomain = "a.local", InviteCode = "ORGA" },
                new Organization { Id = orgB, Name = "Org B", EmailDomain = "b.local", InviteCode = "ORGB" });

            seed.Rooms.AddRange(
                new Room { Id = Guid.NewGuid(), OrganizationId = orgA, Name = "A Room", Capacity = 10, IsBookable = true },
                new Room { Id = Guid.NewGuid(), OrganizationId = orgB, Name = "B Room", Capacity = 10, IsBookable = true });

            await seed.SaveChangesAsync();
        }

        await using var tenantA = TestDb.CreateContext(dbName, orgA);
        await using var tenantB = TestDb.CreateContext(dbName, orgB);

        var roomsA = tenantA.Rooms.Select(r => r.Name).ToList();
        var roomsB = tenantB.Rooms.Select(r => r.Name).ToList();

        Assert.Single(roomsA);
        Assert.Equal("A Room", roomsA[0]);
        Assert.Single(roomsB);
        Assert.Equal("B Room", roomsB[0]);
    }
}
