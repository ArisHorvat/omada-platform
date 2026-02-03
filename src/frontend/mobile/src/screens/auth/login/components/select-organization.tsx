import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Hooks & Config
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { API_BASE_URL } from '@/src/config/config';

// UI Toolkit
import { 
  AppText, 
  GlassView, 
  Icon, 
  Skeleton, 
  PulseIndicator, 
  ProgressiveImage
} from '@/src/components/ui';

export default function SelectOrganizationScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const { addAccount } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const token = params.token as string;
  const organizations = params.organizations ? JSON.parse(params.organizations as string) : [];

  const handleSelect = async (org: any) => {
    setIsLoading(true);
    try {
      const decoded: any = jwtDecode(token);
      
      if (decoded.organizationId === org.organizationId) {
        await addAccount(token);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/auth/switch-org`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ organizationId: org.organizationId })
        });

        if (!response.ok) throw new Error('Failed to switch organization');
        const data = await response.json();
        await addAccount(data.token);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select organization.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* Header */}
      <View style={{ padding: 24, paddingBottom: 10 }}>
        <AppText variant="h2" style={{ marginBottom: 8 }}>Select Organization</AppText>
        <AppText variant="body" style={{ color: colors.subtle }}>
          Choose the workspace you want to enter.
        </AppText>
      </View>

      {/* Main List */}
      <FlatList
        data={organizations}
        keyExtractor={(item) => item.organizationId}
        contentContainerStyle={{ padding: 24, paddingTop: 10 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
            <TouchableOpacity 
              onPress={() => handleSelect(item)} 
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <GlassView 
                intensity={15} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 16, 
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border + '50'
                }}
              >
                {/* Logo / Icon */}
                {item.logoUrl ? (
                  <ProgressiveImage 
                    source={{ uri: item.logoUrl }} 
                    style={{ width: 48, height: 48, borderRadius: 12, marginRight: 16, backgroundColor: colors.card }} 
                  />
                ) : (
                  <View style={{ 
                    width: 48, height: 48, borderRadius: 12, marginRight: 16, 
                    backgroundColor: colors.primary + '15', 
                    alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Icon name="business" size={24} color={colors.primary} />
                  </View>
                )}

                {/* Text Info */}
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>{item.organizationName}</AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 6 }} />
                     <AppText variant="caption" style={{ color: colors.subtle }}>{item.role}</AppText>
                  </View>
                </View>

                {/* Arrow */}
                <Icon name="chevron-right" size={20} color={colors.subtle} />
              </GlassView>
            </TouchableOpacity>
          </Animated.View>
        )}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <GlassView 
            intensity={50} 
            style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                justifyContent: 'center', alignItems: 'center',
                zIndex: 999 
            }}
        >
            <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 20, alignItems: 'center', shadowOpacity: 0.1, shadowRadius: 20 }}>
                <PulseIndicator size={12} color={colors.primary} />
                <AppText style={{ marginTop: 16 }} weight="bold">Switching Workspace...</AppText>
            </View>
        </GlassView>
      )}

    </SafeAreaView>
  );
}