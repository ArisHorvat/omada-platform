import React from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, ClayView, Icon, IconName, AppButton } from '@/src/components/ui';
import { useWidgetAssignmentLogic } from '../hooks/useWidgetAssignmentLogic';
import { useRegistrationContext } from '../context/RegistrationContext';
import { PermissionLevel } from '@/src/constants/permissions';

export default function WidgetsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { roleWidgetAccess, toggleWidgetForRole, roles } = useRegistrationContext();
  const { visibleWidgets, activeWidgetId, setActiveWidgetId, isWidgetActive } = useWidgetAssignmentLogic();

  const getPermissionVisuals = (level: PermissionLevel | undefined) => {
    switch (level) {
      case 'view': return { icon: 'visibility', color: colors.success, label: 'Viewer' };
      case 'edit': return { icon: 'edit', color: '#F59E0B', label: 'Editor' };
      case 'admin': return { icon: 'verified-user', color: colors.error, label: 'Admin' };
      default: return { icon: 'add-circle-outline', color: colors.subtle, label: 'Assign' };
    }
  };

  return (
    <WizardLayout 
        step={4} totalSteps={6} title="Enable Widgets" subtitle="Assign permissions" 
        onBack={() => router.back()} onNext={() => router.push('/register-flow/users')}
    >
        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 40 }}>
          {visibleWidgets.map(item => {
            const active = isWidgetActive(item.id);
            return (
              <TouchableOpacity key={item.id} style={{ width: '48%' }} onPress={() => setActiveWidgetId(item.id)}>
                <ClayView style={{ 
                    padding: 12, 
                    borderRadius: 24, 
                    alignItems: 'center', 
                    height: 140, // Fixed height for perfect grid
                    justifyContent: 'space-between',
                    backgroundColor: active ? colors.primary + '15' : colors.card,
                    borderWidth: active ? 2 : 0, 
                    borderColor: colors.primary
                }}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: active ? colors.primary : colors.background, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={item.icon as IconName} size={24} color={active ? '#FFF' : colors.text} />
                        </View>
                    </View>
                    
                    <View style={{ height: 30, justifyContent: 'flex-start' }}>
                        <AppText weight="bold" style={{ fontSize: 14 }}>{item.name}</AppText>
                    </View>

                    {active && (
                        <View style={{ position: 'absolute', top: 10, right: 10 }}>
                            <Icon name="check-circle" size={18} color={colors.primary} />
                        </View>
                    )}
                </ClayView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* PERMISSIONS MODAL */}
        <Modal 
            visible={!!activeWidgetId} 
            transparent 
            animationType="fade" 
            onRequestClose={() => setActiveWidgetId(null)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalWrapper}>
                    {/* 1. CLAYVIEW: The Shell (Matches Roles Screen exactly) */}
                    <ClayView style={{ 
                        borderRadius: 24, 
                        backgroundColor: colors.background,
                        width: '100%',
                        minHeight: 300 // <--- FORCE HEIGHT to prevent invisible/pill issue
                    }}>
                        {/* 2. INNER VIEW: The Padding & Structure */}
                        <View style={{ padding: 24, width: '100%' }}>
                            
                            {/* Header */}
                            <View style={{ marginBottom: 20 }}>
                                <AppText variant="h3" style={{ marginBottom: 4 }}>Assign Permissions</AppText>
                                <AppText variant="caption" style={{ color: colors.subtle }}>
                                    Tap to cycle: View → Edit → Admin
                                </AppText>
                            </View>
                            
                            {/* Scrollable List */}
                            <ScrollView style={{ maxHeight: 400 }}>
                                {roles.map(role => {
                                    const visuals = getPermissionVisuals(activeWidgetId ? roleWidgetAccess[role]?.[activeWidgetId] : undefined);
                                    const isSelected = !!(activeWidgetId && roleWidgetAccess[role]?.[activeWidgetId]);
                                    
                                    return (
                                        <TouchableOpacity 
                                            key={role} 
                                            onPress={() => activeWidgetId && toggleWidgetForRole(role, activeWidgetId)} 
                                            style={{ marginBottom: 10 }}
                                        >
                                            <ClayView style={{ 
                                                flexDirection: 'row', alignItems: 'center', 
                                                padding: 12, borderRadius: 16, 
                                                backgroundColor: isSelected ? visuals.color + '10' : colors.card 
                                            }}>
                                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isSelected ? visuals.color + '20' : colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                                    <Icon name={visuals.icon as IconName} size={20} color={visuals.color} />
                                                </View>
                                                <View>
                                                    <AppText weight="bold">{role}</AppText>
                                                    <AppText variant="caption" style={{ color: visuals.color }}>{visuals.label}</AppText>
                                                </View>
                                            </ClayView>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                            
                            <AppButton 
                                title="Done" 
                                onPress={() => setActiveWidgetId(null)} 
                                style={{ marginTop: 24, width: '100%' }} 
                            />
                        
                        </View>
                    </ClayView>
                </View>
            </View>
        </Modal>
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 24
    },
    modalWrapper: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center' // Ensures the ClayView stays centered in the wrapper
    }
});