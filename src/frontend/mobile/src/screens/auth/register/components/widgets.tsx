import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView, Switch, Modal } from 'react-native';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { WizardLayout } from '@/src/components/WizardLayout';
import { useRouter } from 'expo-router';
import { createStyles } from '@/src/screens/auth/register/styles/widgets.styles';
import { useWidgetAssignmentLogic } from '../hooks/useWidgetAssignmentLogic';

export default function WidgetsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { visibleWidgets, activeWidgetId, setActiveWidgetId, isWidgetActive, toggleWidget, toggleRoleForWidget, roles, roleWidgets } = useWidgetAssignmentLogic();

  return (
    <WizardLayout step={5} totalSteps={6} title="Enable Widgets" onBack={() => router.back()} onNext={() => router.push('/register-flow/users')}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {visibleWidgets.map(item => {
            const active = isWidgetActive(item.id);
            // Check if recommended (simple logic: if pre-selected for any role)
            const isRecommended = active; 

            return (
              <TouchableOpacity key={item.id} style={[styles.tile, active && styles.tileActive]} onPress={() => setActiveWidgetId(item.id)}>
                <View style={styles.tileHeader}>
                  <View style={[styles.iconBox, active && { backgroundColor: colors.primary + '20' }]}>
                    <MaterialIcons name={item.icon as any} size={24} color={active ? colors.primary : colors.subtle} />
                  </View>
                  <Switch 
                    value={active} 
                    onValueChange={() => toggleWidget(item.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={'#fff'}
                  />
                </View>
                <View>
                    <Text style={styles.tileName}>{item.name}</Text>
                    <Text style={styles.tileDesc}>{item.description}</Text>
                </View>
                {isRecommended && !active && (
                    <View style={styles.badge}><Text style={styles.badgeText}>Rec</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!activeWidgetId} transparent animationType="slide" onRequestClose={() => setActiveWidgetId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign to Roles</Text>
            <ScrollView>
                {roles.map(role => {
                    const isSelected = roleWidgets[role]?.has(activeWidgetId!);
                    return (
                        <TouchableOpacity key={role} style={styles.roleRow} onPress={() => toggleRoleForWidget(role, activeWidgetId!)}>
                            <Text style={[styles.roleName, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>{role}</Text>
                            {isSelected && <MaterialIcons name="check-circle" size={24} color={colors.primary} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveWidgetId(null)}>
                <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </WizardLayout>
  );
}
