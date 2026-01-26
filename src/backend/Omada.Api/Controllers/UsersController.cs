using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.DTOs.Users;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserRepository userRepository, ILogger<UsersController> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        // Extracts the User ID from the JWT token claims
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(id)) throw new UnauthorizedAccessException();
        return Guid.Parse(id);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try 
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound();
            
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
            var orgIdClaim = User.FindFirst("organizationId")?.Value;
            
            // Fetch granular widget access
            var accessMap = orgIdClaim != null ? await _userRepository.GetUserWidgetAccessAsync(userId, Guid.Parse(orgIdClaim)) : new List<(string, string)>();

            return Ok(new { 
                user.Id, user.FirstName, user.LastName, user.Email, Role = role, 
                user.IsTwoFactorEnabled, user.PhoneNumber, user.Address, user.ProfilePictureUrl,
                WidgetAccess = accessMap.ToDictionary(x => x.WidgetKey, x => x.AccessLevel)
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            {
                return BadRequest("Incorrect current password.");
            }

            user.ChangePassword(BCrypt.Net.BCrypt.HashPassword(request.NewPassword));
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "Password updated successfully." });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpPut("security")]
    public async Task<IActionResult> UpdateSecurity([FromBody] UpdateSecurityRequest request)
    {
        try
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound();

            user.ToggleTwoFactor(request.IsTwoFactorEnabled);
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "Security settings updated." });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound();

            user.UpdateProfile(request.PhoneNumber, request.Address, request.ProfilePictureUrl);
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "Profile updated successfully." });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }
}
