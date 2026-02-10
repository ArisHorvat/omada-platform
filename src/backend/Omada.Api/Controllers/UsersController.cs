using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.DTOs.Users;
using Omada.Api.Abstractions;
using Omada.Api.Entities; 

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
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(id)) throw new UnauthorizedAccessException();
        return Guid.Parse(id);
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(ServiceResponse<User>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe()
    {
        try 
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            
            if (user == null) 
                return NotFound(new ServiceResponse(false, new AppError(ErrorCodes.NotFound, "User not found")));
            
            return Ok(new ServiceResponse<User>(true, user));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "Session expired")));
        }
        catch (Exception ex)
        {
             return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpPut("profile")]
    [ProducesResponseType(typeof(ServiceResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) 
                return NotFound(new ServiceResponse(false, new AppError(ErrorCodes.NotFound, "User not found")));

            user.UpdateProfile(request.PhoneNumber, request.Address, request.ProfilePictureUrl);
            await _userRepository.UpdateAsync(user);

            return Ok(new ServiceResponse<string>(true, "Profile updated successfully"));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "Session expired")));
        }
        catch (Exception ex)
        {
             return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpPut("security")]
    [ProducesResponseType(typeof(ServiceResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateSecurity([FromBody] UpdateSecurityRequest request)
    {
        try
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) 
                return NotFound(new ServiceResponse(false, new AppError(ErrorCodes.NotFound, "User not found")));

            user.ToggleTwoFactor(request.IsTwoFactorEnabled);
            await _userRepository.UpdateAsync(user);

            return Ok(new ServiceResponse<string>(true, "Security settings updated"));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "Session expired")));
        }
        catch (Exception ex)
        {
             return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }
}