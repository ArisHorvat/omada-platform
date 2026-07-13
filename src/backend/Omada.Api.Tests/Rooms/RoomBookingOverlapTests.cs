using Omada.Api.DTOs.Rooms;
using Omada.Api.Repositories;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services;
using Omada.Api.Tests.Infrastructure;

namespace Omada.Api.Tests.Rooms;

/// <summary>
/// Thesis verification: room booking overlap rejection.
/// </summary>
public class RoomBookingOverlapTests
{
    [Fact]
    public async Task BookRoomAsync_RejectsOverlappingInterval()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = TestDb.CreateContext(dbName, organizationId: null);
        var (orgId, userId, roomId) = await TestDb.SeedBookableRoomAsync(context);

        var tenantContext = TestDb.CreateContext(dbName, orgId);
        var uow = new UnitOfWork(tenantContext);
        var roomRepo = new RoomRepository(tenantContext);
        var service = new RoomService(uow, new FixedUserContext(userId, orgId), roomRepo);

        var start = new DateTime(2026, 3, 10, 10, 0, 0, DateTimeKind.Utc);
        var end = start.AddHours(1);

        var first = await service.BookRoomAsync(roomId, new BookRoomRequest { StartUtc = start, EndUtc = end });
        var second = await service.BookRoomAsync(roomId, new BookRoomRequest
        {
            StartUtc = start.AddMinutes(30),
            EndUtc = end.AddMinutes(30),
        });

        Assert.True(first.IsSuccess);
        Assert.False(second.IsSuccess);
        Assert.Equal("ROOM_CONFLICT", second.Error?.Code);
    }

    [Fact]
    public async Task BookRoomAsync_AllowsAdjacentNonOverlappingIntervals()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = TestDb.CreateContext(dbName, organizationId: null);
        var (orgId, userId, roomId) = await TestDb.SeedBookableRoomAsync(context);

        var tenantContext = TestDb.CreateContext(dbName, orgId);
        var uow = new UnitOfWork(tenantContext);
        var roomRepo = new RoomRepository(tenantContext);
        var service = new RoomService(uow, new FixedUserContext(userId, orgId), roomRepo);

        var start = new DateTime(2026, 3, 10, 10, 0, 0, DateTimeKind.Utc);
        var end = start.AddHours(1);

        var first = await service.BookRoomAsync(roomId, new BookRoomRequest { StartUtc = start, EndUtc = end });
        var second = await service.BookRoomAsync(roomId, new BookRoomRequest
        {
            StartUtc = end,
            EndUtc = end.AddHours(1),
        });

        Assert.True(first.IsSuccess);
        Assert.True(second.IsSuccess);
    }
}
