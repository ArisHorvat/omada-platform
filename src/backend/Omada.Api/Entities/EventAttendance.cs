namespace Omada.Api.Entities;

public class EventAttendance : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    
    // The specific date of the class they are modifying
    public DateTime InstanceDate { get; set; } 
    
    public AttendanceStatus Status { get; set; }

    public virtual Event Event { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}