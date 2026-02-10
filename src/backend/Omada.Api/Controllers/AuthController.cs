using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Omada.Api.Entities;
using Omada.Api.DTOs.Auth;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Abstractions;

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
    [ProducesResponseType(typeof(ServiceResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ServiceResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);
        
        try 
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Invalid login attempt for email: {Email}", request.Email);
                return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "Invalid email or password.")));
            }

            // Get memberships to determine default org
            var memberships = await _userRepository.GetMembershipsAsync(user.Id);
            
            // Default to the first org found
            var primaryMembership = memberships.FirstOrDefault();
            if (primaryMembership == null)
            {
                 return StatusCode(403, new ServiceResponse(false, new AppError(ErrorCodes.Forbidden, "User does not belong to any organization.")));
            }

            var orgId = primaryMembership.OrganizationId;
            var role = primaryMembership.Role ?? "User";

            var token = GenerateJwtToken(user, orgId, role);

            var response = new LoginResponse
            {
                Token = token,
                User = new UserDto { Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName },
                OrganizationId = orgId,
                Role = role
            };

            return Ok(new ServiceResponse<LoginResponse>(true, response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error");
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, "An unexpected error occurred during login.")));
        }
    }

    [HttpGet("organizations")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(typeof(ServiceResponse<List<UserOrganizationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrganizations()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);
            var currentOrgId = User.FindFirst("OrganizationId")?.Value;

            var memberships = await _userRepository.GetMembershipsAsync(userId);
            var result = new List<UserOrganizationDto>();

            foreach (var m in memberships)
            {
                var org = await _organizationRepository.GetByIdAsync(m.OrganizationId);
                if (org != null)
                {
                    result.Add(new UserOrganizationDto
                    {
                        OrganizationId = org.Id,
                        OrganizationName = org.Name,
                        Role = m.Role,
                        IsCurrent = org.Id.ToString().Equals(currentOrgId, StringComparison.OrdinalIgnoreCase)
                    });
                }
            }

            return Ok(new ServiceResponse<List<UserOrganizationDto>>(true, result));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpPost("switch-org")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(typeof(ServiceResponse<LoginResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SwitchOrganization([FromBody] SwitchOrgRequest request)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return Unauthorized(new ServiceResponse(false, new AppError(ErrorCodes.Unauthorized, "User not found")));

            var memberships = await _userRepository.GetMembershipsAsync(userId);
            var targetMembership = memberships.FirstOrDefault(m => m.OrganizationId == request.OrganizationId);

            if (targetMembership == null)
            {
                return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.Forbidden, "You are not a member of this organization.")));
            }

            // Generate new token for the target organization
            var token = GenerateJwtToken(user, targetMembership.OrganizationId, targetMembership.Role);
            
            // Re-use LoginResponse structure but with just the new token and org details
            var response = new LoginResponse
            {
                Token = token,
                User = new UserDto { Id = user.Id, Email = user.Email },
                OrganizationId = targetMembership.OrganizationId,
                Role = targetMembership.Role
            };
            
            return Ok(new ServiceResponse<LoginResponse>(true, response));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ServiceResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);

            // Always return success to prevent email enumeration
            if (user == null)
            {
                return Ok(new ServiceResponse<string>(true, "If the email exists, a reset link has been sent."));
            }

            var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
            user.SetPasswordResetToken(token, DateTime.UtcNow.AddHours(1));
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("Password reset token for {Email}: {Token}", request.Email, token);
            
            return Ok(new ServiceResponse<string>(true, "If the email exists, a reset link has been sent."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ServiceResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            
            if (user == null || user.PasswordResetToken != request.Token || user.PasswordResetTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, "Invalid or expired token.")));
            }

            var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ChangePassword(newHash);
            user.ClearPasswordResetToken();
            
            await _userRepository.UpdateAsync(user);

            return Ok(new ServiceResponse<string>(true, "Password has been reset successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResponse(false, new AppError(ErrorCodes.InternalError, ex.Message)));
        }
    }

    private string GenerateJwtToken(User user, Guid organizationId, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("OrganizationId", organizationId.ToString()),
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