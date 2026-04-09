namespace Omada.Api.Entities;

public class RoomBooking : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid RoomId { get; set; }
    public Guid BookedByUserId { get; set; }
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public string? Notes { get; set; }

    public virtual Room Room { get; set; } = null!;
    public virtual User BookedBy { get; set; } = null!;
}
