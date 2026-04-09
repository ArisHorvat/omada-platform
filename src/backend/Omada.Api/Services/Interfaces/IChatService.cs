using Omada.Api.Abstractions;
using Omada.Api.DTOs.Chat;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IChatService
{
    Task<ServiceResponse<PagedResponse<Message>>> GetRecentMessagesAsync(PagedRequest request);
    Task<ServiceResponse<Message>> SendMessageAsync(CreateMessageRequest request);
}