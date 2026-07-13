import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { ScreenTransition } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { UserProfilePanel } from './UserProfilePanel';

export default function UserProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenTransition style={{ flex: 1 }}>
        <PageContainer>
          <ScreenHeader title="Profile" />
          <UserProfilePanel
            userId={id}
            onOpenUser={(managerId) =>
              router.push({ pathname: '/user-profile', params: { id: managerId } } as never)
            }
            onFilterByGroup={(groupId) =>
              router.replace({ pathname: '/users', params: { groupId } } as never)
            }
          />
        </PageContainer>
      </ScreenTransition>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
