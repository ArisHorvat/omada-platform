import React from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, GlassView, Icon, IconName, AppButton } from '@/src/components/ui';
import { useWidgetAssignmentLogic } from '../hooks/useWidgetAssignmentLogic';

export default function WidgetsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { visibleWidgets, activeWidgetId, setActiveWidgetId, isWidgetActive, toggleRoleForWidget, roles, roleWidgets } = useWidgetAssignmentLogic();

  return (
    <WizardLayout 
        step={4} 
        totalSteps={6} 
        title="Enable Widgets" 
        subtitle="Tap to configure features"
        onBack={() => router.back()} 
        onNext={() => router.push('/register-flow/users')}
    >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {visibleWidgets.map(item => {
            const active = isWidgetActive(item.id);

            return (
              <TouchableOpacity 
                key={item.id} 
                style={{ width: '48%' }}
                onPress={() => setActiveWidgetId(item.id)}
                activeOpacity={0.8}
              >
                <GlassView 
                    intensity={active ? 30 : 10}
                    style={{ 
                        padding: 16, borderRadius: 20,
                        alignItems: 'center', minHeight: 120, justifyContent: 'center',
                        borderWidth: 2, 
                        // CHANGED: Use colors.border for inactive state instead of transparent
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + '10' : undefined
                    }}
                >
                    <Icon name={item.icon as IconName} size={32} color={active ? colors.primary : colors.subtle} />
                    <AppText weight="bold" style={{ marginTop: 12, marginBottom: 4 }}>{item.name}</AppText>
                    
                    {active && (
                        <View style={{ position: 'absolute', top: 10, right: 10 }}>
                            <Icon name="check-circle" size={18} color={colors.primary} />
                        </View>
                    )}
                </GlassView>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Role Assignment Modal */}
        <Modal 
            visible={!!activeWidgetId} 
            transparent 
            animationType="fade"
            onRequestClose={() => setActiveWidgetId(null)}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
                <GlassView intensity={50} style={{ padding: 24, borderRadius: 24, backgroundColor: colors.background }}>
                    <AppText variant="h3" style={{ marginBottom: 16 }}>Assign Access</AppText>
                    <AppText variant="body" style={{ color: colors.subtle, marginBottom: 20 }}>
                        Which roles should see this widget?
                    </AppText>

                    <ScrollView style={{ maxHeight: 300 }}>
                        {roles.map(role => {
                            const isSelected = activeWidgetId ? roleWidgets[role]?.has(activeWidgetId) : false;
                            return (
                                <TouchableOpacity 
                                    key={role} 
                                    style={{ 
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                        padding: 16, borderRadius: 12, marginBottom: 8,
                                        backgroundColor: isSelected ? colors.primary + '15' : colors.card
                                    }}
                                    onPress={() => activeWidgetId && toggleRoleForWidget(role, activeWidgetId)}
                                >
                                    <AppText weight={isSelected ? "bold" : "regular"} style={{ color: isSelected ? colors.primary : colors.text }}>
                                        {role}
                                    </AppText>
                                    {isSelected && <Icon name="check" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <AppButton title="Done" onPress={() => setActiveWidgetId(null)} style={{ marginTop: 24 }} />
                </GlassView>
            </View>
        </Modal>
    </WizardLayout>
  );
}