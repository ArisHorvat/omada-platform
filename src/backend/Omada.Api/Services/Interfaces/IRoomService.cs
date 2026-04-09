using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Rooms;

namespace Omada.Api.Services.Interfaces;

public interface IRoomService
{
    Task<ServiceResponse<IEnumerable<RoomDto>>> GetAllRoomsAsync();
    Task<ServiceResponse<PagedResponse<RoomDto>>> SearchRoomsAsync(RoomSearchRequest request);
    Task<ServiceResponse<RoomDto>> GetRoomByIdAsync(Guid id);
    Task<ServiceResponse<RoomDto>> CreateRoomAsync(CreateRoomRequest request);
    Task<ServiceResponse<RoomDto>> UpdateRoomAsync(Guid id, CreateRoomRequest request);
    Task<ServiceResponse<bool>> DeleteRoomAsync(Guid id);
    Task<ServiceResponse<RoomBookingDto>> BookRoomAsync(Guid roomId, BookRoomRequest request);
}