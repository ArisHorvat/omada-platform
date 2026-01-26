namespace Omada.Api.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    
    // Nullable fields for profile info
    public string? PhoneNumber { get; private set; }
    public string? ProfilePictureUrl { get; private set; }
    public string? CNP { get; private set; }
    public string? Address { get; private set; }
    public string? PasswordResetToken { get; private set; }
    public DateTime? PasswordResetTokenExpires { get; private set; }
    
    public bool IsTwoFactorEnabled { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastLoginAt { get; private set; }

    // Private constructor for EF Core / Dapper
    private User() { }

    public static Result<User> Create(
        string firstName, 
        string lastName, 
        string email, 
        string password, 
        string? cnp = null,
        string? phoneNumber = null,
        string? address = null)
    {
        if (string.IsNullOrWhiteSpace(firstName)) return Result<User>.Failure("First name is required.");
        if (string.IsNullOrWhiteSpace(lastName)) return Result<User>.Failure("Last name is required.");
        if (string.IsNullOrWhiteSpace(email)) return Result<User>.Failure("Email is required.");
        // Domain validation removed to allow BYOE (Bring Your Own Email)

        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        return Result<User>.Success(new User
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PasswordHash = hashedPassword,
            CNP = cnp,
            PhoneNumber = phoneNumber,
            Address = address,
            CreatedAt = DateTime.UtcNow,
            IsTwoFactorEnabled = false
        });
    }

    public void UpdateProfile(string? phoneNumber, string? address, string? profilePictureUrl)
    {
        PhoneNumber = phoneNumber;
        Address = address;
        ProfilePictureUrl = profilePictureUrl;
    }

    public void ChangePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }

    public void ToggleTwoFactor(bool enabled)
    {
        IsTwoFactorEnabled = enabled;
    }

    public void SetPasswordResetToken(string token, DateTime expires)
    {
        PasswordResetToken = token;
        PasswordResetTokenExpires = expires;
    }

    public void ClearPasswordResetToken()
    {
        PasswordResetToken = null;
        PasswordResetTokenExpires = null;
    }
}
