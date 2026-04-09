namespace Omada.Api.DTOs.Rooms;

public class BookRoomRequest
{
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public string? Notes { get; set; }
}
