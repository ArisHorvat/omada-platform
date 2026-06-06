import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { WidgetPageShell } from '@/src/components/layout/WidgetPageShell';
import { ScreenHeader, type ScreenHeaderProps } from '@/src/components/navigation/ScreenHeader';
import { useThemeColors } from '@/src/hooks';

export interface ScreenScaffoldProps extends Omit<ScreenHeaderProps, 'footer'> {
  children: React.ReactNode;
  headerFooter?: ScreenHeaderProps['footer'];
  fullBleed?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Standard pushed screen: safe top, optional max-width column, unified header, scrollable body.
 */
export function ScreenScaffold({
  children,
  headerFooter,
  fullBleed,
  style,
  contentStyle,
  ...headerProps
}: ScreenScaffoldProps) {
  const colors = useThemeColors();

  return (
    <WidgetPageShell fullBleed={fullBleed}>
      <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <PageContainer fullBleed={fullBleed} style={{ flex: 1 }}>
            <ScreenHeader {...headerProps} footer={headerFooter} />
            <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
          </PageContainer>
        </SafeAreaView>
      </View>
    </WidgetPageShell>
  );
}
