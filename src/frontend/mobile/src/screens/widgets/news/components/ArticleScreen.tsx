import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { useThemeColors } from '@/src/hooks';
import { ArticlePanel } from './ArticlePanel';

export default function ArticleScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <PageContainer>
        <ScreenHeader title="News" />
        <ArticlePanel articleId={id} />
      </PageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
