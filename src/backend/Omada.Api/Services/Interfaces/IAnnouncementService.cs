using Omada.Api.Abstractions;
using Omada.Api.DTOs.Announcements;
using Omada.Api.DTOs.Common;

namespace Omada.Api.Services.Interfaces;

public interface IAnnouncementService
{
    Task<ServiceResponse<List<AnnouncementChannelDto>>> GetAccessibleChannelsAsync(
        CancellationToken cancellationToken = default);
    Task<ServiceResponse<PagedResponse<AnnouncementPostDto>>> GetChannelPostsAsync(Guid channelId, PagedRequest request);
    Task<ServiceResponse<PagedResponse<AnnouncementPostDto>>> GetFeedAsync(PagedRequest request);
    Task<ServiceResponse<AnnouncementPostDto>> CreatePostAsync(Guid channelId, CreateAnnouncementPostRequest request);
    Task<ServiceResponse<List<AnnouncementCommentDto>>> GetPostCommentsAsync(Guid postId);
    Task<ServiceResponse<AnnouncementCommentDto>> CreateCommentAsync(Guid postId, CreateAnnouncementCommentRequest request);
    Task<ServiceResponse<bool>> MarkChannelReadAsync(Guid channelId);
}
