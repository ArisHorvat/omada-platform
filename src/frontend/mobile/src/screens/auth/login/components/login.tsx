import React, { useRef, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Hooks & Logic
import { useThemeColors } from '@/src/hooks';
import { useLoginLogic } from '../hooks/useLoginLogic';

// UI Toolkit
import { 
  AppText, 
  AppButton, 
  GlassView, 
  IconInput, 
  Toast, // <--- Imported Toast
} from '@/src/components/ui';
import { ShakeView, ShakeViewRef } from '@/src/components/animations';

export default function LoginScreen() {
  const colors = useThemeColors();
  const { email, setEmail, password, setPassword, isLoading, handleLogin } = useLoginLogic();
  
  // Local UI State
  const [showPassword, setShowPassword] = useState(false);
  const shakeRef = useRef<ShakeViewRef>(null);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ visible: true, message, type });
    // Hide after 3 seconds
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Wrapper to trigger shake on error
  const onLoginPress = async () => {
    // Reset toast
    setToast(prev => ({ ...prev, visible: false }));

    try {
      if (!email || !password) {
        shakeRef.current?.shake();
        showToast('Please fill in all fields'); // <--- Trigger Toast
        return;
      }
      await handleLogin();
    } catch (e: any) {
      shakeRef.current?.shake();
      showToast(e.message || 'Login failed'); // <--- Trigger Toast
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Replaced ScrollView with a Centered View */}
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            
            {/* Header Animation */}
            <Animated.View entering={FadeInDown.duration(600).springify()}>
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    {/* Removed the empty square View here */}
                    <AppText variant="h1" style={{ color: colors.text, marginBottom: 8 }}>Welcome Back</AppText>
                    <AppText variant="body" style={{ color: colors.subtle }}>Sign in to your account</AppText>
                </View>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
                <ShakeView ref={shakeRef}>
                    <GlassView intensity={20} style={{ padding: 24, borderRadius: 24, gap: 16 }}>
                        
                        <IconInput 
                            icon="mail" 
                            placeholder="Email Address" 
                            value={email} 
                            onChangeText={setEmail} 
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        
                        <IconInput 
                            icon="lock" 
                            rightIcon={showPassword ? 'visibility' : 'visibility-off'}
                            onRightIconPress={() => setShowPassword(!showPassword)}
                            placeholder="Password" 
                            value={password} 
                            onChangeText={setPassword} 
                            secureTextEntry={!showPassword} 
                        />

                        <View style={{ height: 8 }} />

                        <AppButton 
                            title="Sign In" 
                            onPress={onLoginPress} 
                            loading={isLoading} 
                            size="lg"
                        />
                    </GlassView>
                </ShakeView>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
                    <AppText style={{ color: colors.subtle }}>Don't have an account?</AppText>
                    <Link href="/register-flow" asChild>
                        <TouchableOpacity>
                            <AppText weight="bold" style={{ color: colors.primary, marginLeft: 6 }}>Register</AppText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </Animated.View>

        </View>

        {/* Toast rendered absolutely at the top or bottom of the screen */}
        {toast.visible && (
            <View style={{ position: 'absolute', bottom: 150, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}>
                <Toast 
                    visible={toast.visible} 
                    message={toast.message} 
                    type={toast.type} 
                />
            </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}