import React from 'react';
import { View } from 'react-native';
import { AppButton, AppFormField, AppText, ClayView } from '@/src/components/ui';
import { NewsPageKind } from '@/src/api/generatedClient';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';
import { ScrapedNewsPreviewCard } from './ScrapedNewsPreviewCard';
import { SpiderSyncHistoryPanel } from './SpiderSyncHistoryPanel';
import { newsKindLabel, SpiderDiscoveryList } from './SpiderDiscoveryList';

type Props = { model: WebSpiderWorkspaceModel };

export function WebSpiderNewsTab({ model }: Props) {
  const {
    colors,
    newsUrl,
    setNewsUrl,
    scheduleUrl,
    urlsSavedInDb,
    busyAction,
    saveUrls,
    previewNews,
    discoverNews,
    newsPreview,
    newsDiscovery,
    applyDiscoveredNewsUrl,
    enqueueNewsSync,
    hasNewsUrl,
    syncHistory,
    syncHistoryLoading,
  } = model;

  return (
    <View>
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="body" style={{ color: colors.text, marginBottom: 10 }}>
          Discovers news archives and articles on the same host, then extracts title, body, and an AI-assigned category
          so you can verify content before it is imported into Omada news.
        </AppText>
        <AppFormField
          label="News URL"
          description={
            urlsSavedInDb
              ? 'Saved news start URL is used for discovery when the field is empty.'
              : 'Article URL for preview, or news section home for discovery. Save URLs to remember for this org.'
          }
          value={newsUrl}
          onChangeText={setNewsUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://university.edu/news/article-123"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <AppButton
            title={busyAction === 'save-config' ? 'Saving…' : 'Save URLs'}
            onPress={saveUrls}
            disabled={!!busyAction || (!newsUrl.trim() && !scheduleUrl.trim())}
            style={{ minWidth: 100 }}
          />
          <AppButton
            title={busyAction === 'news-preview' ? 'Scraping…' : 'Preview article'}
            onPress={previewNews}
            disabled={!!busyAction}
            style={{ minWidth: 130 }}
          />
          <AppButton
            title={busyAction === 'news-discover' ? 'Discovering…' : 'Discover pages'}
            variant="outline"
            onPress={discoverNews}
            disabled={!!busyAction}
            style={{ minWidth: 130 }}
          />
          <AppButton
            title={busyAction === 'news-sync' ? 'Queuing…' : 'Sync to DB'}
            variant="outline"
            onPress={enqueueNewsSync}
            disabled={!!busyAction || !hasNewsUrl}
            style={{ minWidth: 120 }}
          />
        </View>
      </ClayView>

      {newsDiscovery?.pages?.length ? (
        <SpiderDiscoveryList
          colors={colors}
          title="Discovered news pages"
          pages={newsDiscovery.pages}
          onSelect={applyDiscoveredNewsUrl}
          kindLabel={(k) => newsKindLabel(k as NewsPageKind | undefined)}
          highlightKinds={[NewsPageKind.Article]}
          secondaryKinds={[NewsPageKind.Archive]}
        />
      ) : null}

      {newsPreview ? (
        <View style={{ marginTop: 12 }}>
          <AppText variant="label" weight="bold" style={{ color: colors.text, marginBottom: 8 }}>
            Scraped article preview
          </AppText>
          <ScrapedNewsPreviewCard model={model} />
        </View>
      ) : null}

      <SpiderSyncHistoryPanel
        colors={colors}
        title="Sync history"
        runs={syncHistory}
        loading={syncHistoryLoading}
      />
    </View>
  );
}
