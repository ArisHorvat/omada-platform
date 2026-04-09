namespace Omada.Api.Abstractions;

public interface IUserContext
{
    Guid UserId { get; }
    Guid OrganizationId { get; }
}