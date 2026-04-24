import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { floorplanPoiButtonLabel } from '@/src/screens/admin/floorplan-workspace/utils/floorplanPoiButtonLabel';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { FLOORPLAN_POI_KINDS, removePoiAt, updatePoiLabel } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FloorplanPoiKindIcon } from '@/src/screens/widgets/map/components/floorplanPoiIcons';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanPinsTab({ model }: Props) {
  const {
    colors,
    activeFloor,
    geoDoc,
    floorplanLoading,
    isWideLayout,
    placePoiKind,
    setPlacePoiKind,
    selectedPoiIndex,
    setSelectedPoiIndex,
    setGeoDoc,
    hasUnsavedChanges,
    savingGeo,
    handleDiscard,
  } = model;

  if (!activeFloor?.floorplanId || !geoDoc || floorplanLoading) {
    return (
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="body" style={{ color: colors.subtle }}>
          {!activeFloor?.floorplanId ? 'Select a floor with a floorplan record to place pins.' : 'Loading floorplan…'}
        </AppText>
      </ClayView>
    );
  }

  return (
    <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
        Map pins (POI)
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
        Pan and zoom anytime nothing is selected. Choose a pin type, move the map if needed, then tap the floorplan to
        drop it. Select a pin to edit its label — the map locks until you deselect.
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        {FLOORPLAN_POI_KINDS.map((kind) => (
          <TouchableOpacity
            key={kind}
            onPress={() => {
              setPlacePoiKind((k) => (k === kind ? null : kind));
              setSelectedPoiIndex(null);
            }}
            style={{ minWidth: isWideLayout ? 156 : '48%' }}
          >
            <ClayView
              depth={placePoiKind === kind ? 2 : 5}
              color={placePoiKind === kind ? colors.primary : colors.background}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 14,
                minHeight: 58,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: placePoiKind === kind ? 'rgba(255,255,255,0.18)' : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FloorplanPoiKindIcon kind={kind} size={18} color={placePoiKind === kind ? '#fff' : colors.primary} />
              </View>
              <AppText weight="bold" style={{ color: placePoiKind === kind ? '#fff' : colors.text }}>
                {floorplanPoiButtonLabel(kind)}
              </AppText>
            </ClayView>
          </TouchableOpacity>
        ))}
      </View>
      {placePoiKind ? (
        <AppText variant="caption" style={{ color: colors.primary, marginBottom: 8 }}>
          Tap the floorplan to place: {placePoiKind}
        </AppText>
      ) : null}
      {geoDoc.pois.map((p, idx) => (
        <ClayView
          key={p.pinId}
          depth={selectedPoiIndex === idx ? 2 : 5}
          color={selectedPoiIndex === idx ? colors.primary : colors.background}
          style={{ borderRadius: 10, padding: 10, marginBottom: 8 }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedPoiIndex(idx);
              setPlacePoiKind(null);
            }}
          >
            <AppText style={{ color: selectedPoiIndex === idx ? '#fff' : colors.text }} weight="bold">
              {p.pinKind} {p.label ? `· ${p.label}` : ''}
            </AppText>
          </TouchableOpacity>
          <TextInput
            value={p.label}
            onChangeText={(t) => setGeoDoc((prev) => (prev ? updatePoiLabel(prev, idx, t) : prev))}
            placeholder="Label"
            placeholderTextColor={colors.subtle}
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors.text,
              backgroundColor: colors.card,
            }}
          />
          <TouchableOpacity
            onPress={() => {
              setGeoDoc((prev) => (prev ? removePoiAt(prev, idx) : prev));
              setSelectedPoiIndex(null);
            }}
            style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Icon name="delete-outline" size={18} color="#ef4444" />
            <AppText variant="caption" style={{ color: '#ef4444' }}>
              Remove pin
            </AppText>
          </TouchableOpacity>
        </ClayView>
      ))}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <AppButton
          title="Deselect pin"
          variant="outline"
          onPress={() => {
            setSelectedPoiIndex(null);
            setPlacePoiKind(null);
          }}
          disabled={selectedPoiIndex == null && placePoiKind == null}
          style={{ flex: 1, minWidth: 140 }}
        />
        <AppButton
          title="Discard"
          variant="outline"
          onPress={handleDiscard}
          disabled={!hasUnsavedChanges || savingGeo}
          style={{ flex: 1, minWidth: 140 }}
        />
      </View>
    </ClayView>
  );
}
