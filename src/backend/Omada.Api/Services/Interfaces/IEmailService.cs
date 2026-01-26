using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendInvitationEmailAsync(string email, string firstName, string orgName, string token);
    }
}