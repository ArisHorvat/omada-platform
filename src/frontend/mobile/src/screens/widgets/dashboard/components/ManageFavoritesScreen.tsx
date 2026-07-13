import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { WidgetPageShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { AnimatedItem, PressScale } from '@/src/components/animations';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { Divider } from '@/src/components/ui/Divider';
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import { ClayAnimations } from '@/src/constants/animations';

export default function ManageFavoritesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  
  // 1. Get the data from your hook
  const { data, config, user } = useDashboardLogic();

  // ----------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------
  const handleAdd = (id: string) => {
    if (user.favorites.includes(id)) return;
    user.updateFavorites([...user.favorites, id]);
  };

  const handleRemove = (id: string) => user.updateFavorites(user.favorites.filter(w => w !== id));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...user.favorites];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    user.updateFavorites(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === user.favorites.length - 1) return;
    const newOrder = [...user.favorites];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    user.updateFavorites(newOrder);
  };

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/dashboard');
  };

  // Filter available widgets
  const availableWidgets = (data.allWidgets || []).filter(id => !user.favorites.includes(id));

  return (
    <WidgetPageShell>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      
      <AnimatedItem animation={ClayAnimations.Header} layout={null}>
        <ScreenHeader
          title="Customize Dashboard"
          showBack
          onBack={closeScreen}
          right={
            <AppButton
              title="Done"
              size="sm"
              variant="primary"
              onPress={closeScreen}
              style={{ width: 'auto', minWidth: 84, paddingHorizontal: 16 }}
            />
          }
        />
      </AnimatedItem>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        
        {/* ACTIVE TITLE */}
        <AnimatedItem index={0} animation={ClayAnimations.List(0)} layout={null}>
            <AppText style={[styles.sectionTitle, { color: colors.text }]}>Active Favorites</AppText>
            <AppText style={styles.subtitle}>These items appear in your Bento Grid.</AppText>
        </AnimatedItem>

        {/* ACTIVE FAVORITES LIST */}
        <View style={{ gap: 12, marginTop: 15 }}>
            {user.favorites.map((id, index) => {
                // FIX: Access via config.definitions[id]
                const widgetDef = config.definitions[id] || { name: id, icon: 'widgets', category: 'General' };
                
                return (
                  <AnimatedItem 
                    key={id} 
                    animation={ClayAnimations.List(index)} 
                    exiting={ClayAnimations.ExitZoom}
                    layout={ClayAnimations.LayoutStable} 
                  >
                    <ClayView depth={10} puffy={10} color={colors.card} style={styles.row}>
                        <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                            <Icon name={widgetDef.icon as IconName} size={24} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                            <AppText weight="bold">{widgetDef.name}</AppText>
                            <AppText variant="caption" style={{ color: colors.subtle }}>{widgetDef.category}</AppText>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => moveUp(index)} disabled={index === 0} style={{ opacity: index === 0 ? 0.3 : 1 }}>
                                <Icon name="arrow-upward" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => moveDown(index)} disabled={index === user.favorites.length - 1} style={{ opacity: index === user.favorites.length - 1 ? 0.3 : 1 }}>
                                <Icon name="arrow-downward" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <View style={{ width: 8 }} />
                            <PressScale onPress={() => handleRemove(id)}>
                                <View style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}>
                                    <Icon name="remove" size={18} color="#D32F2F" />
                                </View>
                            </PressScale>
                        </View>
                    </ClayView>
                  </AnimatedItem>
                );
            })}
        </View>

        <Divider margin={30} />

        {/* AVAILABLE TITLE */}
        <AnimatedItem index={1} animation={ClayAnimations.List(1)} layout={null}>
            <AppText style={[styles.sectionTitle, { color: colors.text }]}>Available Widgets</AppText>
        </AnimatedItem>

        {/* AVAILABLE WIDGETS LIST */}
        <View style={{ gap: 12, marginTop: 15 }}>
            {availableWidgets.map((id, index) => {
                // FIX: Access via config.definitions[id]
                const widgetDef = config.definitions[id] || { name: id, icon: 'widgets', category: 'General' };

                return (
                  <AnimatedItem 
                    key={id} 
                    animation={ClayAnimations.List(index + 2)} 
                    exiting={ClayAnimations.ExitZoom} 
                    layout={ClayAnimations.LayoutStable}
                  >
                    <ClayView depth={5} puffy={5} color={colors.card} style={[styles.row, { opacity: 0.8 }]}>
                         <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                            <Icon name={widgetDef.icon as IconName} size={24} color={colors.subtle} />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                            <AppText weight="medium">{widgetDef.name}</AppText>
                            <AppText variant="caption" style={{ color: colors.subtle }}>{widgetDef.category}</AppText>
                        </View>
                        <PressScale onPress={() => handleAdd(id)}>
                             <View style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}>
                                <Icon name="add" size={20} color="#2E7D32" />
                            </View>
                        </PressScale>
                    </ClayView>
                  </AnimatedItem>
                );
            })}
        </View>

      </ScrollView>
    </SafeAreaView>
    </WidgetPageShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    minHeight: 70, 
  },
  iconBox: {
    width: 40, 
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }
});