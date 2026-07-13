using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Security;

namespace Omada.Api.Tests.Security;

/// <summary>
/// Thesis verification: widget access hierarchy and aliases.
/// </summary>
public class PermissionHandlerTests
{
    [Theory]
    [InlineData("documents:view", AccessLevel.View, true)]
    [InlineData("documents:view", AccessLevel.Edit, false)]
    [InlineData("documents:edit", AccessLevel.View, true)]
    [InlineData("documents:edit", AccessLevel.Edit, true)]
    [InlineData("documents:admin", AccessLevel.Edit, true)]
    [InlineData("documents:admin", AccessLevel.Admin, true)]
    public void MeetsRequirement_EnforcesCumulativeAccessLevels(string permission, AccessLevel required, bool expected)
    {
        var permissions = new List<string> { permission };

        var result = PermissionHandler.MeetsRequirement(permissions, WidgetKeys.Documents, required);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void MeetsRequirement_TasksAliasSatisfiesAssignmentsPolicy()
    {
        var permissions = new List<string> { $"{WidgetKeys.Assignments}:edit" };

        var result = PermissionHandler.MeetsRequirement(permissions, WidgetKeys.Tasks, AccessLevel.Edit);

        Assert.True(result);
    }

    [Fact]
    public void MeetsRequirement_AnnouncementsAliasSatisfiesLegacyNewsPolicy()
    {
        var permissions = new List<string> { $"{WidgetKeys.News}:view" };

        var result = PermissionHandler.MeetsRequirement(permissions, WidgetKeys.Announcements, AccessLevel.View);

        Assert.True(result);
    }

    [Fact]
    public void MeetsRequirement_ReturnsFalse_WhenWidgetMissing()
    {
        var permissions = new List<string> { $"{WidgetKeys.Schedule}:view" };

        var result = PermissionHandler.MeetsRequirement(permissions, WidgetKeys.Documents, AccessLevel.View);

        Assert.False(result);
    }
}
