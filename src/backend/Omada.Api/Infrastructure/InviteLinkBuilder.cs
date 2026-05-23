namespace Omada.Api.Infrastructure;

public interface IInviteLinkBuilder
{
    string BuildJoinLink(string inviteCode);
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
        var baseUrl = _configuration["AppConfig:PublicAppUrl"]?.TrimEnd('/')
            ?? _configuration["AppConfig:BaseUrl"]?.TrimEnd('/')
            ?? "http://localhost:8081";
        return $"{baseUrl}/join?code={Uri.EscapeDataString(inviteCode)}";
    }
}
