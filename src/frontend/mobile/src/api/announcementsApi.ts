import apiClient from '@/src/api/apiClient';
import {
  AnnouncementsClient,
  AnnouncementChannelDto,
  AnnouncementChannelKind,
  AnnouncementPostDto,
  CreateAnnouncementPostRequest,
  PagedResponseOfAnnouncementPostDto,
  ServiceResponseOfListOfAnnouncementChannelDto,
  ServiceResponseOfPagedResponseOfAnnouncementPostDto,
  ServiceResponseOfAnnouncementPostDto,
} from '@/src/api/generatedClient';
import { API_BASE_URL } from '@/src/config/config';

export {
  AnnouncementChannelKind,
  AnnouncementPostDto,
  CreateAnnouncementPostRequest,
};

/** API channel row — includes unreadCount from backend (regen NSwag to fold into generated type). */
export type AnnouncementChannelView = AnnouncementChannelDto & {
  unreadCount?: number;
};

export { AnnouncementChannelDto };

export interface AnnouncementCommentDto {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

type ServiceEnvelope<T> = {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

const client = new AnnouncementsClient(API_BASE_URL, apiClient);

export function isGeneralChannel(c: AnnouncementChannelDto): boolean {
  return c.kind === AnnouncementChannelKind.General;
}

export function isGroupChannel(c: AnnouncementChannelDto): boolean {
  return c.kind === AnnouncementChannelKind.Group;
}

export function isCourseChannel(c: AnnouncementChannelDto): boolean {
  return c.kind === AnnouncementChannelKind.CourseOffering;
}

export function getChannelUnreadCount(c: AnnouncementChannelView): number {
  return c.unreadCount ?? 0;
}

export const announcementsApi = {
  getChannels: async (): Promise<ServiceResponseOfListOfAnnouncementChannelDto> => {
    const res = await client.getChannels();
    return res;
  },
  getChannelPosts: (channelId: string, page?: number, pageSize?: number) =>
    client.getChannelPosts(channelId, page, pageSize),
  getFeed: (page?: number, pageSize?: number) => client.getFeed(page, pageSize),
  createPost: (channelId: string, request: CreateAnnouncementPostRequest) =>
    client.createPost(channelId, request),

  getPostComments: (postId: string) =>
    apiClient.get<ServiceEnvelope<AnnouncementCommentDto[]>>(`/announcements/posts/${postId}/comments`),

  createComment: (postId: string, content: string) =>
    apiClient.post<ServiceEnvelope<AnnouncementCommentDto>>(`/announcements/posts/${postId}/comments`, {
      content,
    }),

  markChannelRead: (channelId: string) =>
    apiClient.post<ServiceEnvelope<boolean>>(`/announcements/channels/${channelId}/read`),
};

export type {
  ServiceResponseOfListOfAnnouncementChannelDto,
  ServiceResponseOfPagedResponseOfAnnouncementPostDto,
  ServiceResponseOfAnnouncementPostDto,
  PagedResponseOfAnnouncementPostDto,
};
