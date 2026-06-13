namespace Omada.Api.Infrastructure;

public interface IInviteLinkBuilder
{
    string BuildJoinLink(string inviteCode);
    string BuildPasswordResetLink(string email, string token);
}

public class InviteLinkBuilder : IInviteLinkBuilder
{
    private readonly IConfiguration _configuration;

    public InviteLinkBuilder(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string BuildJoinLink(string inviteCode)
    {
        var baseUrl = ResolvePublicAppBaseUrl();
        return $"{baseUrl}/join?code={Uri.EscapeDataString(inviteCode)}";
    }

    public string BuildPasswordResetLink(string email, string token)
    {
        var baseUrl = ResolvePublicAppBaseUrl();
        return
            $"{baseUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
    }

    private string ResolvePublicAppBaseUrl() =>
        _configuration["AppConfig:PublicAppUrl"]?.TrimEnd('/')
        ?? _configuration["AppConfig:BaseUrl"]?.TrimEnd('/')
        ?? "http://localhost:8081";
}
