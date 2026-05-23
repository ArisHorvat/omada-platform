using System.Security.Cryptography;

namespace Omada.Api.Infrastructure;

public static class OrganizationInviteCodeGenerator
{
    private const string Chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string Generate(int length = 8)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        return new string(bytes.Select(b => Chars[b % Chars.Length]).ToArray());
    }
}
