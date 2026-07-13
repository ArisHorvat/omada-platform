using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Omada.Api.Infrastructure.Security;

namespace Omada.Api.Tests.Security;

/// <summary>
/// Thesis verification: JWT tenant claim — three supported claim key formats.
/// </summary>
public class HttpTenantAccessorTests
{
    [Theory]
    [InlineData("OrganizationId")]
    [InlineData("organizationId")]
    [InlineData("orgId")]
    public void CurrentOrganizationId_ReadsSupportedClaimKeys(string claimType)
    {
        var orgId = Guid.NewGuid();
        var accessor = CreateAccessor(new Claim(claimType, orgId.ToString()));

        Assert.Equal(orgId, accessor.CurrentOrganizationId);
    }

    [Fact]
    public void CurrentOrganizationId_ReturnsNull_WhenUnauthenticated()
    {
        var accessor = CreateAccessor();

        Assert.Null(accessor.CurrentOrganizationId);
    }

    [Fact]
    public void CurrentOrganizationId_ReturnsNull_WhenClaimMissing()
    {
        var accessor = CreateAccessor(new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));

        Assert.Null(accessor.CurrentOrganizationId);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("")]
    public void CurrentOrganizationId_ReturnsNull_WhenClaimInvalid(string value)
    {
        var accessor = CreateAccessor(new Claim("OrganizationId", value));

        Assert.Null(accessor.CurrentOrganizationId);
    }

    [Fact]
    public void CurrentOrganizationId_PrefersOrganizationIdClaim_WhenMultiplePresent()
    {
        var preferred = Guid.NewGuid();
        var accessor = CreateAccessor(
            new Claim("OrganizationId", preferred.ToString()),
            new Claim("organizationId", Guid.NewGuid().ToString()),
            new Claim("orgId", Guid.NewGuid().ToString()));

        Assert.Equal(preferred, accessor.CurrentOrganizationId);
    }

    private static HttpTenantAccessor CreateAccessor(params Claim[] claims)
    {
        var identity = claims.Length == 0
            ? new ClaimsIdentity()
            : new ClaimsIdentity(claims, authenticationType: "Test");

        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity),
        };

        var httpContextAccessor = new HttpContextAccessor { HttpContext = context };
        return new HttpTenantAccessor(httpContextAccessor);
    }
}
