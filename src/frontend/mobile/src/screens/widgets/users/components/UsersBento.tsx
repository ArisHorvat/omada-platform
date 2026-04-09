import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ClayView, AppText, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { PressClay } from '@/src/components/animations/PressClay';

export const UsersBento = () => {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={styles.fill}>
      <PressClay onPress={() => router.push('/users' as any)} style={styles.pressFill}>
        <ClayView depth={12} puffy={28} color={colors.card} style={styles.bento}>
          <View style={styles.row}>
            <Icon name="search" size={28} color={colors.primary} />
            <AppText variant="h3" weight="bold" style={{ color: colors.primary }} numberOfLines={1}>
              Search
            </AppText>
          </View>
          <AppText variant="body" style={{ color: colors.subtle, marginTop: 8, textAlign: 'center' }}>
            Directory
          </AppText>
        </ClayView>
      </PressClay>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressFill: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bento: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: '78%',
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
