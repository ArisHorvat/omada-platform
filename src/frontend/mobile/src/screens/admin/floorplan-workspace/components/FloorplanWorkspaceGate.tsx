import React from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { createFloorplanWorkspaceStyles } from '@/src/screens/admin/floorplan-workspace/styles/floorplanWorkspaceScreen.styles';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanWorkspaceGate({ model }: Props) {
  const { colors, insets, horizontalPad, isWideLayout, setWorkspaceIntent, setCreateLevelChoiceLocked, setActiveTab } =
    model;
  const router = useRouter();
  const styles = createFloorplanWorkspaceStyles(colors);
  const gateRow = isWideLayout;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: horizontalPad, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}
          hitSlop={12}
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
          <AppText variant="h2" weight="bold">
            Floorplan
          </AppText>
        </Pressable>
        <AppText weight="bold" style={styles.gateTitle}>
          How do you want to start?
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 22, lineHeight: 20 }}>
          Create a brand-new level, or open an existing floor to change the image, rooms, and pins.
        </AppText>

        <View
          style={{
            flexDirection: gateRow ? 'row' : 'column',
            alignItems: 'stretch',
            gap: gateRow ? 14 : 0,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            style={{ flex: gateRow ? 1 : undefined }}
            onPress={() => {
              setWorkspaceIntent('create');
              setCreateLevelChoiceLocked(false);
              setActiveTab('setup');
            }}
          >
            <ClayView
              depth={5}
              color={colors.card}
              style={[styles.gateCard, { minHeight: gateRow ? 210 : undefined }]}
            >
              <View style={styles.gateIconWrap}>
                <Icon name="add-circle-outline" size={30} color={colors.primary} />
              </View>
              <AppText weight="bold" style={styles.gateCardTitle}>
                Create a new floor
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
                Confirm building and level, choose an image, add that level to the building, then optionally run AI to
                detect rooms.
              </AppText>
            </ClayView>
          </TouchableOpacity>

          {gateRow ? (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
                minWidth: 56,
              }}
            >
              <Icon name="swap-horiz" size={28} color={colors.subtle} />
              <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginTop: 6 }}>
                or
              </AppText>
            </View>
          ) : (
            <View style={styles.orDividerRow}>
              <View style={styles.orDividerLine} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="swap-horiz" size={24} color={colors.subtle} />
                <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                  or
                </AppText>
              </View>
              <View style={styles.orDividerLine} />
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.92}
            style={{ flex: gateRow ? 1 : undefined }}
            onPress={() => {
              setWorkspaceIntent('edit');
              setCreateLevelChoiceLocked(false);
              setActiveTab('setup');
            }}
          >
            <ClayView
              depth={5}
              color={colors.card}
              style={[styles.gateCard, { minHeight: gateRow ? 210 : undefined }]}
            >
              <View style={styles.gateIconWrap}>
                <Icon name="map" size={28} color={colors.primary} />
              </View>
              <AppText weight="bold" style={styles.gateCardTitle}>
                View or update a floorplan
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
                Select building and floor, refresh the image or run extraction, then refine rooms and pins in the
                workspace.
              </AppText>
            </ClayView>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
