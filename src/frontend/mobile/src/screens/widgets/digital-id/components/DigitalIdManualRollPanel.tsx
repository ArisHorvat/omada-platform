import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText, ClayView, IconInput } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { usersApi, unwrap } from '@/src/api';
import { useThemeColors } from '@/src/hooks';
import type { AttendanceSessionDto } from '@/src/api/generatedClient';
import { DigitalIdClaySection, DIGITAL_ID_CLAY_RADIUS } from './DigitalIdClaySection';

type Props = {
  activeSession: AttendanceSessionDto | null;
  onMarkPresent: (userId: string, fullName: string) => Promise<void>;
  isRecording: boolean;
};

export function DigitalIdManualRollPanel({
  activeSession,
  onMarkPresent,
  isRecording,
}: Props) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');

  const directoryQuery = useQuery({
    queryKey: ['digital-id-manual-roll', query],
    queryFn: async () => unwrap(usersApi.getDirectory(1, 8, query.trim() || null, null, null, null)),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  const members = directoryQuery.data?.items ?? [];

  return (
    <DigitalIdClaySection title="Manual roll" style={styles.wrap}>
      <AppText variant="body" style={{ color: colors.subtle, lineHeight: 20, marginBottom: 12 }}>
        Search a member and mark them present without scanning.
      </AppText>
      <IconInput
        icon="search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!activeSession ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 12, lineHeight: 18 }}>
          Select a session above to record attendance.
        </AppText>
      ) : null}
      <View style={{ marginTop: 12, gap: 8 }}>
        {members.map((member) => {
          const name = `${member.firstName} ${member.lastName}`.trim();
          return (
            <PressClay
              key={member.id}
              onPress={() => {
                if (!activeSession || isRecording) return;
                void onMarkPresent(member.id, name);
              }}
            >
              <ClayView
                depth={4}
                puffy={12}
                color={colors.background}
                contentOverflow="visible"
                contentFlexGrow={0}
                style={{
                  borderRadius: DIGITAL_ID_CLAY_RADIUS - 4,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <View style={styles.memberRow}>
                  <AppText variant="body" weight="medium" style={{ color: colors.text, flex: 1 }}>
                    {name}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.primary }}>
                    Mark present
                  </AppText>
                </View>
              </ClayView>
            </PressClay>
          );
        })}
      </View>
      {query.trim().length >= 2 && !directoryQuery.isLoading && members.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10 }}>
          No members found.
        </AppText>
      ) : null}
    </DigitalIdClaySection>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
