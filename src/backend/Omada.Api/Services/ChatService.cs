using Omada.Api.Abstractions;
using Omada.Api.DTOs.Chat;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;


    public ChatService(IUnitOfWork uow, IUserContext userContext)
    {
        _uow = uow;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<PagedResponse<Message>>> GetRecentMessagesAsync(PagedRequest request)
    {
        var organizationId = _userContext.OrganizationId;

        // 1. Use the upgraded UoW pagination with sorting!
        var pagedResult = await _uow.Repository<Message>().GetPagedAsync(
            request.Page,
            request.PageSize,
            predicate: m => m.OrganizationId == organizationId,
            orderBy: q => q.OrderByDescending(m => m.CreatedAt) // Newest first
        );

        // 2. Reverse the items list so the UI displays them top-to-bottom
        pagedResult.Items = pagedResult.Items.OrderBy(m => m.CreatedAt).ToList();

        return new ServiceResponse<PagedResponse<Message>>(true, pagedResult);
    }

    public async Task<ServiceResponse<Message>> SendMessageAsync(CreateMessageRequest request)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;


        var user = await _uow.Repository<User>().GetByIdAsync(userId);
        if (user == null) 
            return new ServiceResponse<Message>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var message = new Message
        {
            OrganizationId = organizationId,
            UserId = userId,
            UserName = request.UserName ?? $"{user.FirstName} {user.LastName}",
            Content = request.Content
        };

        await _uow.Repository<Message>().AddAsync(message);
        await _uow.CompleteAsync();

        return new ServiceResponse<Message>(true, message);
    }
}