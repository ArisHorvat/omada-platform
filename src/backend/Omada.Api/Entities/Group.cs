namespace Omada.Api.Entities;

public class Group
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public Guid? ManagerId { get; private set; }
    public Guid? ParentGroupId { get; private set; }
    public string? ScheduleConfig { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Group() { }

    public static Result<Group> Create(Guid organizationId, string name, string type, Guid? managerId, Guid? parentGroupId, string? scheduleConfig)
    {
        if (string.IsNullOrWhiteSpace(name)) return Result<Group>.Failure("Group name is required.");
        if (string.IsNullOrWhiteSpace(type)) return Result<Group>.Failure("Group type is required.");

        return Result<Group>.Success(new Group
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = name,
            Type = type,
            ManagerId = managerId,
            ParentGroupId = parentGroupId,
            ScheduleConfig = scheduleConfig,
            CreatedAt = DateTime.UtcNow
        });
    }
}