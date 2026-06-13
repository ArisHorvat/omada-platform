import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ZoomIn, FadeInUp, Easing } from 'react-native-reanimated';
import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { AppText, AppButton, ClayView, Icon } from '@/src/components/ui';
import { setCompletingRegistrationSuccess } from '@/src/utils/registrationSuccessFlow';
import { useRegistrationContext } from '../context/RegistrationContext';

export default function RegistrationSuccessScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { orgData } = useRegistrationContext();

  useEffect(() => {
    return () => setCompletingRegistrationSuccess(false);
  }, []);

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
                Organization created
              </AppText>
              <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center' }}>
                {orgData.name || 'Your organization'} is ready. Continue to the admin console to finish setup —
                roles, widgets, invites, and more.
              </AppText>

              <AppButton
                title="Go to admin console"
                onPress={() => {
                  setCompletingRegistrationSuccess(false);
                  router.replace('/org-dashboard');
                }}
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
