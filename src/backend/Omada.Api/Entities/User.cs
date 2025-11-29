namespace Omada.Api.Entities;

public class User
{
    public Guid Id { get; private set; }
    public Guid? OrganizationId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;

    private User() { }

    public static Result<User> Create(Guid organizationId, string fullName, string email, string password, string emailDomain)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return Result<User>.Failure("User full name cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(email) || !email.EndsWith(emailDomain, StringComparison.OrdinalIgnoreCase))
        {
            return Result<User>.Failure($"User email must belong to the '{emailDomain}' domain.");
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return Result<User>.Failure("Password must be at least 8 characters long.");
        }

        // In a real application, use a strong password hashing library like BCrypt.Net
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            FullName = fullName,
            Email = email,
            PasswordHash = passwordHash,
            Role = "Admin" // The first user is always an Admin
        };

        return Result<User>.Success(user);
    }
}
