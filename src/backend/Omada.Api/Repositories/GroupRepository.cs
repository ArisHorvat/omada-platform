using System.Data;
using Dapper;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly IDbConnection _dbConnection;

    public GroupRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task CreateAsync(Group group)
    {
        const string sql = @"
            INSERT INTO Groups (Id, OrganizationId, Name, Type, ManagerId, ParentGroupId, ScheduleConfig, CreatedAt)
            VALUES (@Id, @OrganizationId, @Name, @Type, @ManagerId, @ParentGroupId, @ScheduleConfig, @CreatedAt);";
        await _dbConnection.ExecuteAsync(sql, group);
    }

    public async Task AddMemberAsync(Guid groupId, Guid userId, string? roleInGroup)
    {
        const string sql = "INSERT INTO GroupMembers (GroupId, UserId, RoleInGroup) VALUES (@GroupId, @UserId, @RoleInGroup);";
        await _dbConnection.ExecuteAsync(sql, new { GroupId = groupId, UserId = userId, RoleInGroup = roleInGroup });
    }

    public async Task<IEnumerable<Group>> GetGroupsForUserAsync(Guid userId)
    {
        const string sql = "SELECT g.* FROM Groups g JOIN GroupMembers gm ON g.Id = gm.GroupId WHERE gm.UserId = @UserId";
        return await _dbConnection.QueryAsync<Group>(sql, new { UserId = userId });
    }

    public async Task<Group?> GetByIdAsync(Guid groupId)
    {
        const string sql = "SELECT * FROM Groups WHERE Id = @Id";
        return await _dbConnection.QuerySingleOrDefaultAsync<Group>(sql, new { Id = groupId });
    }
}
