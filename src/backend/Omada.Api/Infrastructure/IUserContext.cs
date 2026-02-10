namespace Omada.Api.Infrastructure;

public interface IUserContext
{
    Guid UserId { get; }
    Guid OrganizationId { get; }
}