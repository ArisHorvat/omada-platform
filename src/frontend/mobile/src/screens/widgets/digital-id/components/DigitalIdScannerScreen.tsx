import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  AppButton,
  AppText,
  ClayView,
  Icon,
  ProgressiveImage,
  WidgetErrorState,
} from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { WidgetPageShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { useDigitalIdScannerLogic } from '../hooks/useDigitalIdScannerLogic';
import { DigitalIdScannerCamera } from './DigitalIdScannerCamera';
import { DigitalIdManualRollPanel } from './DigitalIdManualRollPanel';
import {
  DigitalIdClaySection,
  DIGITAL_ID_CLAY_INSET,
  DIGITAL_ID_CLAY_RADIUS,
} from './DigitalIdClaySection';
import { formatSessionTime } from '@/src/screens/widgets/attendance/utils/attendanceLabels';
import type { AttendanceSessionDto } from '@/src/api/generatedClient';
import { alertAction } from '@/src/utils/confirmAction';

export default function DigitalIdScannerScreen({ adminConsole = false }: { adminConsole?: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();
  const {
    teacherSessions,
    sessionsLoading,
    lastScan,
    scanError,
    isScanning,
    isRecording,
    handleScanToken,
    resetScan,
    recordAttendance,
    organizationKind,
  } = useDigitalIdScannerLogic();

  const [selectedSession, setSelectedSession] = useState<AttendanceSessionDto | null>(null);

  const activeSession = selectedSession ?? teacherSessions[0] ?? null;

  const headerBack = useMemo(
    () =>
      adminConsole
        ? { showBack: true as const, onBack: () => router.replace('/admin-digital-id' as never) }
        : {},
    [adminConsole, router],
  );

  const markPresentForUser = async (userId: string, displayName: string) => {
    if (!activeSession) return;
    try {
      await recordAttendance({
        session: activeSession,
        userId,
        organizationKind,
      });
      await alertAction({
        title: 'Attendance recorded',
        message: `${displayName} marked present for ${activeSession.title}.`,
      });
      resetScan();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not record attendance.';
      await alertAction({ title: 'Attendance', message: msg });
    }
  };

  const markPresent = async () => {
    if (!lastScan?.valid || !lastScan.userId || !activeSession) return;
    await markPresentForUser(lastScan.userId, lastScan.fullName ?? 'Member');
  };

  return (
    <WidgetPageShell fullBleed={adminConsole}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title="Scan Digital ID" {...headerBack} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AppText variant="body" style={{ color: colors.subtle, marginBottom: 16, lineHeight: 22 }}>
            Verify a member&apos;s rotating QR, then optionally mark them present for the selected session.
          </AppText>

          <DigitalIdClaySection title="Session" style={styles.section}>
            {sessionsLoading ? (
              <AppText variant="body" style={{ color: colors.subtle }}>
                Loading sessions…
              </AppText>
            ) : teacherSessions.length === 0 ? (
              <AppText variant="body" style={{ color: colors.subtle, lineHeight: 22 }}>
                No upcoming sessions you manage. You can still verify IDs without recording attendance.
              </AppText>
            ) : (
              <View style={{ gap: 8 }}>
                {teacherSessions.slice(0, 6).map((session) => {
                  const selected = activeSession?.eventId === session.eventId;
                  return (
                    <PressClay key={session.eventId} onPress={() => setSelectedSession(session)}>
                      <ClayView
                        depth={selected ? 6 : 4}
                        puffy={12}
                        color={selected ? `${colors.primary}18` : colors.background}
                        contentOverflow="visible"
                        contentFlexGrow={0}
                        style={[
                          styles.sessionChip,
                          selected && { borderWidth: 1, borderColor: colors.primary },
                        ]}
                      >
                        <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                          {session.title}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                          {formatSessionTime(session)}
                          {session.groupName ? ` · ${session.groupName}` : ''}
                        </AppText>
                      </ClayView>
                    </PressClay>
                  );
                })}
              </View>
            )}
          </DigitalIdClaySection>

          <DigitalIdScannerCamera onScanToken={handleScanToken} disabled={isScanning} />

          {isScanning ? (
            <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 12 }}>
              Verifying…
            </AppText>
          ) : null}

          {scanError && !lastScan?.valid ? (
            <WidgetErrorState message={scanError} onRetry={resetScan} />
          ) : null}

          {lastScan?.valid ? (
            <ClayView
              depth={10}
              puffy={18}
              color={colors.card}
              contentOverflow="visible"
              contentFlexGrow={0}
              style={styles.resultCard}
            >
              <View style={styles.resultHeader}>
                <Icon name="check-circle" size={22} color={colors.success} />
                <AppText variant="h3" weight="bold" style={{ color: colors.text, marginLeft: 8 }}>
                  Verified
                </AppText>
              </View>
              <View style={styles.resultRow}>
                {lastScan.avatarUrl ? (
                  <ProgressiveImage source={{ uri: lastScan.avatarUrl }} style={styles.resultAvatar} />
                ) : (
                  <View
                    style={[
                      styles.resultAvatar,
                      { backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
                    ]}
                  >
                    <Icon name="person" size={28} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                    {lastScan.fullName}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {lastScan.roleName}
                  </AppText>
                </View>
              </View>

              <View style={styles.actions}>
                {activeSession ? (
                  <AppButton
                    title="Mark present"
                    icon="check"
                    loading={isRecording}
                    onPress={() => void markPresent()}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                ) : null}
                <AppButton
                  title="Scan another"
                  variant="secondary"
                  onPress={resetScan}
                  style={{ flex: 1 }}
                />
              </View>
              {!activeSession ? (
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 12, textAlign: 'center', lineHeight: 18 }}>
                  Select a session above to record attendance, or verify only.
                </AppText>
              ) : null}
            </ClayView>
          ) : null}

          <DigitalIdManualRollPanel
            activeSession={activeSession}
            isRecording={isRecording}
            onMarkPresent={markPresentForUser}
          />
        </ScrollView>
      </SafeAreaView>
    </WidgetPageShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sessionChip: {
    borderRadius: DIGITAL_ID_CLAY_RADIUS - 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultCard: {
    marginTop: 16,
    borderRadius: DIGITAL_ID_CLAY_RADIUS,
    ...DIGITAL_ID_CLAY_INSET,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  resultAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
