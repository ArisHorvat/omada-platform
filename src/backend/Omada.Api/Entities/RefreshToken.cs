namespace Omada.Api.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }

    // Navigation Property
    public virtual User User { get; set; } = null!;

    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}