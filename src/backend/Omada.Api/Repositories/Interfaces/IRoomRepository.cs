using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IRoomRepository : IGenericRepository<Room>
{
    Task<Room?> GetRoomWithRestrictionsAsync(Guid id);
    Task<IEnumerable<Room>> GetAllRoomsWithRestrictionsAsync(Guid orgId);
    Task<PagedResponse<Room>> SearchRoomsAsync(Guid orgId, RoomSearchRequest request);
}