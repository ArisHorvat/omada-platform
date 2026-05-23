import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ZoomIn, FadeInUp, Easing } from 'react-native-reanimated';
import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors, useClipboard } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { AppText, AppButton, ClayView, Icon, CodeBlock } from '@/src/components/ui';
import { useRegistrationContext } from '../context/RegistrationContext';
import { adminOnboardingEmailPreview } from '@/src/constants/inviteEmailTemplates';
import { Alert, Share } from 'react-native';

export default function RegistrationSuccessScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { activeSession } = useAuth();
  const { copyToClipboard } = useClipboard();
  const { createdOrgInvite, orgData, adminData } = useRegistrationContext();

  const handleFinish = () => {
    if (
      activeSession?.role === 'SuperAdmin' ||
      activeSession?.role === 'Admin' ||
      activeSession?.role === 'Super Admin'
    ) {
      router.replace('/org-dashboard');
    } else {
      router.replace('/login-flow');
    }
  };

  const inviteCode = createdOrgInvite?.inviteCode ?? '—';
  const inviteLink = createdOrgInvite?.inviteLink ?? '—';

  const adminTemplate = adminOnboardingEmailPreview(
    adminData.firstName || 'Admin',
    orgData.name || 'Your organization',
    inviteLink,
    inviteCode,
  );

  const copyCode = async () => {
    if (!createdOrgInvite?.inviteCode) return;
    await copyToClipboard(createdOrgInvite.inviteCode);
    Alert.alert('Copied', 'Organization code copied.');
  };

  const shareLink = async () => {
    if (!createdOrgInvite) return;
    await Share.share({
      message: `Join ${orgData.name} on Omada:\n${createdOrgInvite.inviteLink}\n\nCode: ${createdOrgInvite.inviteCode}`,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthContentShell centered style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, width: '100%' }}>
          <ClayView
            style={{
              width: '100%',
              padding: 32,
              borderRadius: 32,
              alignItems: 'center',
              backgroundColor: colors.card,
              gap: 20,
            }}
          >
            <Animated.View entering={ZoomIn.duration(300).easing(Easing.out(Easing.ease))}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.success + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={50} color={colors.success} />
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(200).duration(300).easing(Easing.out(Easing.ease))}
              style={{ alignItems: 'center', width: '100%', gap: 16 }}
            >
              <AppText variant="h2" style={{ textAlign: 'center' }}>
                All Set!
              </AppText>
              <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center' }}>
                Your organization is ready. Share the code or link below, and check your inbox for
                setup details.
              </AppText>

              {createdOrgInvite && (
                <View style={{ width: '100%', gap: 12 }}>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    ORGANIZATION CODE
                  </AppText>
                  <ClayView
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: colors.background,
                      alignItems: 'center',
                    }}
                  >
                    <AppText variant="h2" weight="bold" style={{ letterSpacing: 4 }}>
                      {inviteCode}
                    </AppText>
                  </ClayView>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    INVITE LINK
                  </AppText>
                  <AppText variant="caption" selectable>
                    {inviteLink}
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <AppButton
                      title="Copy code"
                      variant="outline"
                      onPress={copyCode}
                      style={{ flex: 1 }}
                    />
                    <AppButton
                      title="Share link"
                      variant="outline"
                      onPress={shareLink}
                      style={{ flex: 1 }}
                      icon="share"
                    />
                  </View>
                </View>
              )}

              <CodeBlock code={adminTemplate} />

              <AppButton
                title={activeSession?.role === 'SuperAdmin' ? 'Go to Dashboard' : 'Go to Login'}
                onPress={handleFinish}
                style={{ width: '100%', backgroundColor: colors.success }}
                textStyle={{ color: '#fff' }}
                size="lg"
              />
            </Animated.View>
          </ClayView>
        </View>
      </AuthContentShell>
    </SafeAreaView>
  );
}
