import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ZoomIn, FadeInUp, Easing } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { AppText, AppButton, ClayView, Icon } from '@/src/components/ui';

export default function RegistrationSuccessScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { activeSession } = useAuth();

  const handleFinish = () => {
    if (activeSession?.role === 'SuperAdmin' || activeSession?.role === 'Admin' || activeSession?.role === 'Super Admin') {
      router.replace('/org-dashboard');
    } else {
      router.replace('/login-flow');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ClayView style={{ width: '100%', padding: 32, borderRadius: 32, alignItems: 'center', backgroundColor: colors.card }}>
            <Animated.View entering={ZoomIn.duration(300).easing(Easing.out(Easing.ease))}>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <Icon name="check" size={50} color={colors.success} />
                </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(200).duration(300).easing(Easing.out(Easing.ease))}
              style={{ alignItems: 'center' }}
            >
                <AppText variant="h2" style={{ textAlign: 'center', marginBottom: 12 }}>All Set!</AppText>
                <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', marginBottom: 32, fontSize: 16 }}>
                    Your organization has been successfully created.
                </AppText>
                <AppButton 
                    title={activeSession?.role === 'SuperAdmin' ? "Go to Dashboard" : "Go to Login"} 
                    onPress={handleFinish}
                    style={{ justifyContent: 'flex-start', width: '100%', backgroundColor: colors.success }}
                    textStyle={{ color: '#fff' }}
                    size="lg"
                />
            </Animated.View>
        </ClayView>
      </View>
    </SafeAreaView>
  );
}