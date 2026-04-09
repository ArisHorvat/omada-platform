using Omada.Api.Abstractions;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IEmailService
{
    Task<ServiceResponse<bool>> SendInvitationEmailAsync(string email, string firstName, string orgName, string token);
}