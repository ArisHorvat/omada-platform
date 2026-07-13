import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import type { OrganizationMemberDto } from '@/src/api/generatedClient';
import { useScrapedHostAliases } from '../hooks/useScrapedHostAliases';

type Props = {
  orgId: string;
  members: OrganizationMemberDto[];
  colors: ReturnType<typeof import('@/src/hooks').useThemeColors>;
  styles: ReturnType<typeof import('../styles/members-workspace.styles').createMembersWorkspaceStyles>;
};

export function ScrapedHostAliasesPanel({ orgId, members, colors, styles }: Props) {
  const { pendingAliases, linkedAliases, isLoading, isSaving, linkPendingToMember } =
    useScrapedHostAliases(orgId);
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const memberOptions = useMemo(
    () =>
      members
        .filter((m) => m.userId && m.isActive !== false)
        .map((m) => ({
          value: m.userId!,
          label: [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.email || 'Member',
          subtitle: m.email ?? undefined,
        })),
    [members],
  );

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (pendingAliases.length > 0) parts.push(`${pendingAliases.length} pending`);
    if (linkedAliases.length > 0) parts.push(`${linkedAliases.length} saved`);
    return parts.join(' · ') || 'No mappings yet';
  }, [pendingAliases.length, linkedAliases.length]);

  if (isLoading) return null;
  if (pendingAliases.length === 0 && linkedAliases.length === 0) return null;

  const openPicker = (scrapedLabel: string) => {
    setActiveLabel(scrapedLabel);
    setPickerOpen(true);
  };

  const handleSelect = async (userId: string | null) => {
    if (!activeLabel || !userId) {
      setPickerOpen(false);
      return;
    }
    const member = members.find((m) => m.userId === userId);
    const displayName = member
      ? [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
      : 'Member';
    await linkPendingToMember(activeLabel, { userId, displayName });
    setPickerOpen(false);
    setActiveLabel(null);
  };

  return (
    <>
      <View style={[styles.clayShell, { marginBottom: 12 }]}>
        <ClayView depth={4} puffy={10} color={colors.card} contentOverflow="hidden" style={styles.clayInner}>
          <PressClay onPress={() => setExpanded((v) => !v)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText weight="bold">Schedule import name mappings</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                  {summary}
                </AppText>
              </View>
              <Icon name={expanded ? 'expand-less' : 'expand-more'} size={24} color={colors.subtle} />
            </View>
          </PressClay>

          {expanded ? (
            <>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10, lineHeight: 18 }}>
                Names from scraped timetables are remembered so you do not remap teachers on every import.
              </AppText>

              {pendingAliases.length > 0 ? (
                <View style={{ marginTop: 14, gap: 10 }}>
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                    Pending — link to a member
                  </AppText>
                  {pendingAliases.map((row) => (
                    <View
                      key={row.scrapedLabel}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText weight="bold">{row.scrapedLabel}</AppText>
                        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                          Pending: {row.pendingDisplayName}
                        </AppText>
                      </View>
                      <AppButton
                        title="Link member"
                        variant="outline"
                        onPress={() => openPicker(row.scrapedLabel)}
                        disabled={isSaving || memberOptions.length === 0}
                      />
                    </View>
                  ))}
                </View>
              ) : null}

              {linkedAliases.length > 0 ? (
                <View style={{ marginTop: pendingAliases.length > 0 ? 16 : 14, gap: 8 }}>
                  <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                    Saved mappings ({linkedAliases.length})
                  </AppText>
                  {linkedAliases.slice(0, 8).map((row) => (
                    <AppText key={row.scrapedLabel} variant="caption" style={{ color: colors.subtle }}>
                      {row.scrapedLabel} → {row.hostDisplayName ?? 'Member'}
                    </AppText>
                  ))}
                  {linkedAliases.length > 8 ? (
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      +{linkedAliases.length - 8} more
                    </AppText>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}
        </ClayView>
      </View>

      <OptionPickerSheet
        isVisible={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setActiveLabel(null);
        }}
        title="Link to member"
        options={memberOptions}
        selected={null}
        onSelect={handleSelect}
        includeAllOption={false}
        height={Math.min(480, 140 + memberOptions.length * 62)}
      />
    </>
  );
}
