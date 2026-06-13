namespace Omada.Api.DTOs.Auth;

public class ResendTwoFactorRequest
{
    public string TwoFactorSessionToken { get; set; } = string.Empty;
}
