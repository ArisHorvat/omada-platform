import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ZoomIn, FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { AppText, AppButton, GlassView, Icon } from '@/src/components/ui';

export default function RegistrationSuccessScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { activeSession } = useAuth();

  const handleFinish = () => {
    if (activeSession?.role === 'SuperAdmin') {
        router.replace('/admin-dashboard');
    } else {
        router.replace('/login-flow');
    }
  };

  return (
    // 1. CHANGED: Background is now standard, not green
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        
        {/* 2. ADDED: A Glass Card to hold the content */}
        <GlassView 
            intensity={10} 
            style={{ 
                width: '100%', 
                padding: 32, 
                borderRadius: 32, 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border
            }}
        >
            <Animated.View entering={ZoomIn.duration(800).springify()}>
                <View style={{ 
                    width: 100, height: 100, borderRadius: 50, 
                    // 3. CHANGED: subtle green circle background
                    backgroundColor: colors.success + '15', 
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                    borderWidth: 2,
                    borderColor: colors.success + '30'
                }}>
                    {/* 4. CHANGED: Icon is now green */}
                    <Icon name="check" size={50} color={colors.success} />
                </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).springify()} style={{ alignItems: 'center' }}>
                {/* 5. CHANGED: Text is now standard color */}
                <AppText variant="h2" style={{ textAlign: 'center', marginBottom: 12 }}>
                    All Set!
                </AppText>
                
                <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', marginBottom: 32, fontSize: 16 }}>
                    Your organization has been successfully created. You can now access your dashboard.
                </AppText>

                {/* 6. CHANGED: Button is now the solid green element */}
                <AppButton 
                    title={activeSession?.role === 'SuperAdmin' ? "Go to Dashboard" : "Go to Login"} 
                    onPress={handleFinish}
                    style={{ 
                        width: '100%', 
                        backgroundColor: colors.success, 
                        justifyContent: 'flex-start', 
                    }}
                    textStyle={{ color: '#fff', textAlign: 'left' }}
                    size="lg"
                />
            </Animated.View>
        </GlassView>

      </View>
    </SafeAreaView>
  );
}