import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import type { MessageDto } from '@/src/api/generatedClient';

interface ChatChannelPanelProps {
  messages: MessageDto[];
}

export function ChatChannelPanel({ messages }: ChatChannelPanelProps) {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();

  const participants = useMemo(() => {
    const names = new Map<string, string>();
    for (const m of messages) {
      const key = m.userId || m.userName || 'unknown';
      const label = m.userName?.trim() || m.userId || 'Member';
      if (!names.has(key)) names.set(key, label);
    }
    return [...names.values()].sort((a, b) => a.localeCompare(b));
  }, [messages]);

  const orgName = organization?.name?.trim() || 'Organization';

  return (
    <View style={styles.root}>
      <ClayView depth={10} puffy={16} color={colors.card} style={styles.hero}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
          <Icon name="chat" size={28} color={colors.primary} />
        </View>
        <AppText variant="h3" weight="bold" style={{ color: colors.text, marginTop: 12 }}>
          {orgName}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, textAlign: 'center' }}>
          Organization-wide channel. Messages are visible to members of this workspace.
        </AppText>
      </ClayView>

      <View style={styles.statsRow}>
        <ClayView depth={4} puffy={8} color={colors.card} style={styles.statCard}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Messages
          </AppText>
          <AppText variant="h3" weight="bold" style={{ color: colors.text, marginTop: 4 }}>
            {messages.length}
          </AppText>
        </ClayView>
        <ClayView depth={4} puffy={8} color={colors.card} style={styles.statCard}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Participants
          </AppText>
          <AppText variant="h3" weight="bold" style={{ color: colors.text, marginTop: 4 }}>
            {participants.length || '—'}
          </AppText>
        </ClayView>
      </View>

      {participants.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" weight="bold" style={{ color: colors.subtle, marginBottom: 10 }}>
            RECENT PARTICIPANTS
          </AppText>
          {participants.slice(0, 12).map((name) => (
            <View key={name} style={[styles.participantRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                <AppText variant="caption" weight="bold" style={{ color: '#FFF' }}>
                  {name.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <AppText variant="body" numberOfLines={1} style={{ color: colors.text, flex: 1 }}>
                {name}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
  },
  section: {
    marginTop: 20,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
