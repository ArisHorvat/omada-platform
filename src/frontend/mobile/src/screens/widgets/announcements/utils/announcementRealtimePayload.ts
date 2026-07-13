import type { AnnouncementCommentDto, AnnouncementPostDto } from '@/src/api/announcementsApi';
import { normalizeGuid } from './announcementIds';

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function parseAnnouncementPostPayload(payload: unknown): AnnouncementPostDto | null {
  const root = readRecord(payload);
  if (!root) return null;

  const data = readRecord(root.data) ?? root;
  const id = normalizeGuid(data.id as string | undefined);
  const channelId = normalizeGuid(data.channelId as string | undefined);
  if (!id || !channelId) return null;

  return {
    ...(data as AnnouncementPostDto),
    id,
    channelId,
    authorId: normalizeGuid(data.authorId as string | undefined) || (data.authorId as string),
  };
}

export function parseAnnouncementCommentPayload(payload: unknown): AnnouncementCommentDto | null {
  const root = readRecord(payload);
  if (!root) return null;

  const data = readRecord(root.data) ?? root;
  const id = normalizeGuid(data.id as string | undefined);
  const postId = normalizeGuid(data.postId as string | undefined);
  if (!id || !postId) return null;

  return {
    ...(data as AnnouncementCommentDto),
    id,
    postId,
  };
}
