import React from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { floorplanPoiButtonLabel } from '@/src/screens/admin/floorplan-workspace/utils/floorplanPoiButtonLabel';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { FLOORPLAN_POI_KINDS, patchPoi, removePoiAt, updatePoiLabel } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FloorplanPoiKindIcon, FloorplanPoiMarkerIcon } from '@/src/screens/widgets/map/components/floorplanPoiIcons';
import { FLOORPLAN_POI_OTHER_ICON_CHOICES } from '@/src/screens/widgets/map/utils/floorplanPoiCustomIcons';

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
    commitGeoDoc,
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
        Pan and zoom when nothing is selected. Pick a pin type, then tap the floorplan to place it. Pins use fixed
        legend colors on the map (no captions). Tap a pin on the map to see its label and type. Select a pin below to
        edit the label or remove it.
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
          {selectedPoiIndex === idx && p.pinKind === 'other' ? (
            <View
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
                Icon (custom POI)
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {FLOORPLAN_POI_OTHER_ICON_CHOICES.map((ic) => {
                    const on = p.iconKey === ic.material;
                    return (
                      <TouchableOpacity
                        key={ic.material}
                        onPress={() =>
                          commitGeoDoc((prev) => (prev ? patchPoi(prev, idx, { iconKey: ic.material }) : prev))
                        }
                      >
                        <ClayView
                          depth={on ? 2 : 5}
                          color={on ? colors.primary : colors.background}
                          style={{
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            alignItems: 'center',
                            minWidth: 56,
                          }}
                        >
                          <FloorplanPoiMarkerIcon
                            kind="other"
                            customIconKey={ic.material}
                            size={22}
                            color={on ? '#fff' : colors.primary}
                          />
                          <AppText
                            variant="caption"
                            numberOfLines={1}
                            style={{ color: on ? '#fff' : colors.subtle, marginTop: 4, maxWidth: 72 }}
                          >
                            {ic.label}
                          </AppText>
                        </ClayView>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              commitGeoDoc((prev) => removePoiAt(prev, idx));
              setSelectedPoiIndex(null);
            }}
            style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Icon
              name="delete-outline"
              size={18}
              color={selectedPoiIndex === idx ? '#FFFFFF' : '#ef4444'}
            />
            <AppText
              variant="caption"
              style={{ color: selectedPoiIndex === idx ? '#FFFFFF' : '#ef4444', fontWeight: '600' }}
            >
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
