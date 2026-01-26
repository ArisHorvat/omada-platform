using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Omada.Api.Entities;
using Omada.Api.DTOs.Auth;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IUserRepository userRepository, IOrganizationRepository organizationRepository, IConfiguration configuration, ILogger<AuthController> logger)
    {
        _userRepository = userRepository;
        _organizationRepository = organizationRepository;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);
        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Invalid login attempt for email: {Email}", request.Email);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        // Get memberships to determine default org
        var memberships = await _userRepository.GetMembershipsAsync(user.Id);
        var defaultMembership = memberships.FirstOrDefault();

        if (defaultMembership == null)
        {
            // User exists but has no organizations. Handle as error or specific case.
            return Unauthorized(new { message = "Account is not associated with any organization." });
        }

        var orgs = new List<UserOrganizationDto>();
        foreach (var m in memberships)
        {
            var o = await _organizationRepository.GetByIdAsync(m.OrganizationId);
            if (o != null)
            {
                orgs.Add(new UserOrganizationDto(o.Id, o.Name, m.Role, o.LogoUrl));
            }
        }

        var token = GenerateJwtToken(user, defaultMembership.OrganizationId, defaultMembership.Role);
        return Ok(new LoginResponse(token, orgs));
    }

    [HttpGet("organizations")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetMyOrganizations()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);

        var memberships = await _userRepository.GetMembershipsAsync(userId);
        var result = new List<object>();
        var currentOrgId = User.FindFirst("organizationId")?.Value;

        foreach (var m in memberships)
        {
            var org = await _organizationRepository.GetByIdAsync(m.OrganizationId);
            if (org != null)
            {
                result.Add(new 
                { 
                    OrganizationId = org.Id, 
                    OrganizationName = org.Name, 
                    Role = m.Role,
                    IsCurrent = org.Id.ToString() == currentOrgId
                });
            }
        }

        return Ok(result);
    }

    [HttpPost("switch-org")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> SwitchOrganization([FromBody] SwitchOrgRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return Unauthorized();

        var memberships = await _userRepository.GetMembershipsAsync(userId);
        var targetMembership = memberships.FirstOrDefault(m => m.OrganizationId == request.OrganizationId);

        if (targetMembership == null)
        {
            return BadRequest(new { message = "You are not a member of this organization." });
        }

        var token = GenerateJwtToken(user, targetMembership.OrganizationId, targetMembership.Role);
        return Ok(new LoginResponse(token, new List<UserOrganizationDto>()));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user == null)
        {
            // Don't reveal that the user doesn't exist
            return Ok(new { message = "If the email exists, a reset link has been sent." });
        }

        var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.SetPasswordResetToken(token, DateTime.UtcNow.AddHours(1));
        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("Password reset token for {Email}: {Token}", request.Email, token);
        // In a real app, send this token via email here (e.g. using SendGrid or SMTP)

        return Ok(new { message = "If the email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        
        if (user == null || user.PasswordResetToken != request.Token || user.PasswordResetTokenExpires < DateTime.UtcNow)
        {
            return BadRequest("Invalid or expired token.");
        }

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ChangePassword(newHash);
        user.ClearPasswordResetToken();
        
        await _userRepository.UpdateAsync(user);

        return Ok(new { message = "Password has been reset successfully." });
    }

    private string GenerateJwtToken(User user, Guid organizationId, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("organizationId", organizationId.ToString()),
            // Assign SuperAdmin role if the email matches, otherwise use the role from the database.
            new Claim(ClaimTypes.Role, 
                user.Email.Equals("me@admin.com", StringComparison.OrdinalIgnoreCase) ? "SuperAdmin" : role
            )
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
