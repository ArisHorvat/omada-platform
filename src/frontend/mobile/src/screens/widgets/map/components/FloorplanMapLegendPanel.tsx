import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import {
  DEFAULT_FLOORPLAN_POI_COLORS,
  FLOORPLAN_POI_LEGEND_ORDER,
  MAP_VIEW_ROOM_BUSY,
  MAP_VIEW_ROOM_FREE,
  defaultPoiLegendLabel,
} from '@/src/screens/widgets/map/utils/floorplanMapLegendConstants';

type Props = {
  colors: AppThemeColors;
  mode: 'indoor' | 'admin';
  /** When indoor: show the GeoJSON regions line. */
  hasFloorplanGeoJson?: boolean;
  style?: ViewStyle;
  /** Wide floorplan column: tighter two-column legend instead of a tall stack. */
  wideLayout?: boolean;
};

/**
 * Indoor: compact free/busy key (fixed green/red). Admin: QA key with POI palette.
 */
const WIDE_BREAK = 560;

function PoiLegendChips({ colors, dense }: { colors: AppThemeColors; dense?: boolean }) {
  return (
    <View style={[styles.poiWrap, dense && styles.poiWrapDense]}>
      {FLOORPLAN_POI_LEGEND_ORDER.map((kind) => (
        <View key={kind} style={styles.poiChip}>
          <View
            style={[
              styles.poiDot,
              dense ? styles.poiDotDense : null,
              { backgroundColor: DEFAULT_FLOORPLAN_POI_COLORS[kind] },
            ]}
          />
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: colors.text, maxWidth: dense ? 64 : 72, fontSize: dense ? 11 : 12 }}
          >
            {defaultPoiLegendLabel(kind)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function FloorplanMapLegendPanel({
  colors,
  mode,
  hasFloorplanGeoJson: _hasGeo,
  style,
  wideLayout: wideLayoutProp,
}: Props) {
  const { width: winW } = useWindowDimensions();
  const wideLayout = wideLayoutProp ?? winW >= WIDE_BREAK;

  const pad = wideLayout ? { paddingHorizontal: 10, paddingVertical: 8 } : { paddingHorizontal: 12, paddingVertical: 10 };

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <ClayView
        depth={4}
        color={colors.card}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          ...pad,
        }}
      >
        {mode === 'indoor' ? (
          wideLayout ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
                  Rooms
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6, fontSize: 10, lineHeight: 14 }}>
                  Tap a bookable room to book or view details.
                </AppText>
                <View style={styles.rowWrap}>
                  <View style={styles.legendChip}>
                    <View style={[styles.swatch, { backgroundColor: MAP_VIEW_ROOM_FREE }]} />
                    <AppText variant="caption" style={{ color: colors.text, fontSize: 11 }}>
                      Free
                    </AppText>
                  </View>
                  <View style={styles.legendChip}>
                    <View style={[styles.swatch, { backgroundColor: MAP_VIEW_ROOM_BUSY }]} />
                    <AppText variant="caption" style={{ color: colors.text, fontSize: 11 }}>
                      Busy
                    </AppText>
                  </View>
                </View>
              </View>
              <View style={[styles.splitCol, { flex: 1.2, minWidth: 0 }]}>
                <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
                  Pins
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6, fontSize: 10, lineHeight: 14 }}>
                  Icon-only on map · tap pin for info
                </AppText>
                <PoiLegendChips colors={colors} dense />
              </View>
            </View>
          ) : (
            <>
              <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 6 }}>
                Room status
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8, fontSize: 11, lineHeight: 15 }}>
                Tap a bookable room to book or see details. Other spaces (e.g. restrooms, storage) stay on the map only.
              </AppText>
              <View style={styles.rowWrap}>
                <View style={styles.legendChip}>
                  <View style={[styles.swatch, { backgroundColor: MAP_VIEW_ROOM_FREE }]} />
                  <AppText variant="caption" style={{ color: colors.text }}>
                    Free room
                  </AppText>
                </View>
                <View style={styles.legendChip}>
                  <View style={[styles.swatch, { backgroundColor: MAP_VIEW_ROOM_BUSY }]} />
                  <AppText variant="caption" style={{ color: colors.text }}>
                    Busy now
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" weight="bold" style={{ color: colors.text, marginTop: 10, marginBottom: 4 }}>
                Map pins
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8, fontSize: 11, lineHeight: 15 }}>
                Pins are icon-only on the map. Tap a pin for its name and details.
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.poiRow}>
                  {FLOORPLAN_POI_LEGEND_ORDER.map((kind) => (
                    <View key={kind} style={styles.poiChip}>
                      <View
                        style={[
                          styles.poiDot,
                          {
                            backgroundColor: DEFAULT_FLOORPLAN_POI_COLORS[kind],
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                          },
                        ]}
                      />
                      <AppText variant="caption" numberOfLines={1} style={{ color: colors.text, maxWidth: 76 }}>
                        {defaultPoiLegendLabel(kind)}
                      </AppText>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )
        ) : wideLayout ? (
          <View style={styles.splitRow}>
            <View style={[styles.splitCol, { flex: 1.1 }]}>
              <AppText weight="bold" style={{ color: colors.text, marginBottom: 4, fontSize: 13 }}>
                Legend
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10, lineHeight: 14 }}>
                Shell + rooms in Rooms tab; doorway ticks on edges. Pins: fixed colors below (no per-pin overrides).
                Digital twin toggles blueprint vs. image fills.
              </AppText>
            </View>
            <View style={[styles.splitCol, { flex: 1, minWidth: 0 }]}>
              <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
                Pin types
              </AppText>
              <PoiLegendChips colors={colors} dense />
            </View>
          </View>
        ) : (
          <>
            <AppText weight="bold" style={{ color: colors.text, marginBottom: 6, fontSize: 14 }}>
              Map legend
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8, lineHeight: 16, fontSize: 11 }}>
              Polygons: building shell + rooms (Rooms tab). Doorway ticks on room edges. Pins use the fixed colors
              below. Toggle “Digital twin” for blueprint vs. image overlay fills.
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4, fontSize: 11 }}>
              POI colors (same on map)
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.poiRow}>
                {FLOORPLAN_POI_LEGEND_ORDER.map((kind) => (
                  <View key={kind} style={styles.poiChip}>
                    <View style={[styles.poiDot, { backgroundColor: DEFAULT_FLOORPLAN_POI_COLORS[kind] }]} />
                    <AppText variant="caption" numberOfLines={1} style={{ color: colors.text, maxWidth: 72 }}>
                      {defaultPoiLegendLabel(kind)}
                    </AppText>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </ClayView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '100%',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  splitCol: {
    flex: 1,
    minWidth: 0,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  poiRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  poiWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
    alignItems: 'center',
  },
  poiWrapDense: {
    gap: 6,
    rowGap: 4,
    justifyContent: 'flex-start',
  },
  poiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  poiDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  poiDotDense: {
    width: 11,
    height: 11,
    borderRadius: 5,
  },
});
