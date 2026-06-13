using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Auth;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }


    [HttpPost("login")]
    public async Task<ActionResult<ServiceResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return response.IsSuccess ? Ok(response) : Unauthorized(response);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ServiceResponse<LoginResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request);
        return response.IsSuccess ? Ok(response) : Unauthorized(response);
    }

    [HttpGet("organizations")]
    [Authorize]
    public async Task<ActionResult<ServiceResponse<List<UserOrganizationDto>>>> GetMyOrganizations()
    {
        var response = await _authService.GetMyOrganizationsAsync();
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpPost("switch-org")]
    [Authorize]
    public async Task<ActionResult<ServiceResponse<LoginResponse>>> SwitchOrganization([FromBody] SwitchOrgRequest request)
    {
        var response = await _authService.SwitchOrganizationAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ServiceResponse<string>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var response = await _authService.ForgotPasswordAsync(request);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ServiceResponse<string>>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var response = await _authService.ResetPasswordAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("verify-2fa")]
    public async Task<ActionResult<ServiceResponse<LoginResponse>>> VerifyTwoFactor([FromBody] VerifyTwoFactorRequest request)
    {
        var response = await _authService.VerifyTwoFactorAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("resend-2fa")]
    public async Task<ActionResult<ServiceResponse<string>>> ResendTwoFactor([FromBody] ResendTwoFactorRequest request)
    {
        var response = await _authService.ResendTwoFactorCodeAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("join")]
    public async Task<ActionResult<ServiceResponse<JoinOrganizationResultDto>>> JoinOrganization([FromBody] JoinOrganizationRequest request)
    {
        var response = await _authService.JoinOrganizationAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [Authorize]
    [HttpPost("join/current-user")]
    public async Task<ActionResult<ServiceResponse<JoinWithCodeResultDto>>> JoinWithCurrentUser(
        [FromBody] JoinWithInviteCodeRequest request)
    {
        var response = await _authService.JoinWithInviteCodeAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [Authorize]
    [HttpGet("pending-invites")]
    public async Task<ActionResult<ServiceResponse<List<PendingOrganizationInviteDto>>>> GetPendingInvites()
    {
        var response = await _authService.GetPendingInvitesAsync();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [Authorize]
    [HttpGet("invite/{inviteCode}/preview")]
    public async Task<ActionResult<ServiceResponse<OrganizationInvitePreviewDto>>> GetInvitePreviewForCurrentUser(string inviteCode)
    {
        var response = await _authService.GetInvitePreviewForCurrentUserAsync(inviteCode);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [Authorize]
    [HttpPost("invites/accept")]
    public async Task<ActionResult<ServiceResponse<LoginResponse>>> AcceptInvite([FromBody] InviteCodeRequest request)
    {
        var response = await _authService.AcceptInviteAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [Authorize]
    [HttpPost("invites/decline")]
    public async Task<ActionResult<ServiceResponse<bool>>> DeclineInvite([FromBody] InviteCodeRequest request)
    {
        var response = await _authService.DeclineInviteAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}