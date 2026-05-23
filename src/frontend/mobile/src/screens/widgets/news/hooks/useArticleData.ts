import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { newsApi, unwrap } from '@/src/api';
import { NewsItemDto, PagedResponseOfNewsItemDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useNewsLogic } from './useNewsLogic';
import type { ParsedArticleAttachment } from '../utils/splitArticleBodyAndAttachments';
import { splitArticleBodyAndAttachments } from '../utils/splitArticleBodyAndAttachments';

const NEWS_PAGE_SIZE = 100;

function findArticleInFeedCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  articleId: string,
): NewsItemDto | undefined {
  const rows = queryClient.getQueriesData<InfiniteData<{ items?: NewsItemDto[] | null }>>({
    queryKey: ['news:feed'],
  });
  for (const [, data] of rows) {
    if (!data?.pages?.length) continue;
    for (const p of data.pages) {
      const found = p.items?.find((x) => x.id === articleId);
      if (found) return found;
    }
  }
  return undefined;
}

export function useArticleData(articleId: string | undefined) {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const { markAsRead, isMarkingAsRead } = useNewsLogic({
    orgId,
    enabled: false,
  });

  const didMarkRead = useRef<string | null>(null);

  useEffect(() => {
    if (!articleId || !orgId) return;
    if (didMarkRead.current === articleId) return;
    didMarkRead.current = articleId;
    void markAsRead(articleId).catch(() => {});
  }, [articleId, orgId, markAsRead]);

  const articleQuery = useQuery({
    queryKey: ['news:article', articleId],
    enabled: !!articleId,
    queryFn: async () => {
      if (!articleId) throw new Error('Article not found.');

      const fromFeed = findArticleInFeedCaches(queryClient, articleId);
      if (fromFeed) return fromFeed;

      let page = 1;
      for (;;) {
        const paged = await unwrap<PagedResponseOfNewsItemDto>(
          newsApi.getAll(page, NEWS_PAGE_SIZE, undefined, undefined),
        );
        const found = (paged.items ?? []).find((x) => x.id === articleId);
        if (found) return found;

        const total = paged.totalCount ?? 0;
        const count = paged.items?.length ?? 0;
        if (count === 0 || page * NEWS_PAGE_SIZE >= total) {
          throw new Error('Article not found.');
        }
        page += 1;
      }
    },
  });

  const article = articleQuery.data;

  const { body: articleBody, attachments } = useMemo(() => {
    if (!article?.content) return { body: '', attachments: [] as ParsedArticleAttachment[] };
    return splitArticleBodyAndAttachments(article.content);
  }, [article?.content]);

  return {
    article,
    articleBody,
    attachments,
    articleQuery,
    isMarkingAsRead,
  };
}
