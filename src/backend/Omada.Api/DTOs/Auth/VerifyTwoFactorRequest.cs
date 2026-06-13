namespace Omada.Api.DTOs.Auth;

public class VerifyTwoFactorRequest
{
    public string TwoFactorSessionToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
