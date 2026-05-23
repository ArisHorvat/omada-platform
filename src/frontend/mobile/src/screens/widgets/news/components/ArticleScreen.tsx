import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppText } from '@/src/components/ui';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { ArticlePanel } from './ArticlePanel';

export default function ArticleScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageContainer>
        <View style={styles.header}>
          <ClayBackButton />
          <AppText variant="h2" weight="bold" style={styles.headerTitle}>
            News
          </AppText>
        </View>
        <ArticlePanel articleId={id} />
      </PageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 6,
  },
  headerTitle: {
    marginLeft: 14,
  },
});
