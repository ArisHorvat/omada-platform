import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { WizardLayout } from '@/src/components/WizardLayout';
import { createStyles } from '@/src/screens/auth/register/styles/roles.styles';
import { useRolesLogic } from '../hooks/useRolesLogic';

export default function RolesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { roles, orgData, editingIndex, editName, setEditName, handleAdd, handleEdit, handleSave, handleDelete } = useRolesLogic();

  const getRoleIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('student') || lower.includes('employee')) return 'face';
    if (lower.includes('teacher') || lower.includes('professor')) return 'school';
    if (lower.includes('admin') || lower.includes('manager')) return 'security';
    return 'badge';
  };

  return (
    <WizardLayout step={4} totalSteps={6} title="Define Roles" onBack={() => router.back()} onNext={() => router.push('/register-flow/widgets')}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.description}>
            We've pre-filled roles for a {orgData.type} organization. Tap to edit or add more.
        </Text>
        
        <View style={styles.grid}>
          {roles.map((role, index) => (
            <TouchableOpacity key={index} style={styles.roleCard} onPress={() => handleEdit(index)}>
              <View style={styles.roleIcon}>
                <MaterialIcons name={getRoleIcon(role)} size={24} color={colors.primary} />
              </View>
              <Text style={styles.roleName}>{role}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.roleCard, styles.addCard]} onPress={handleAdd}>
            <MaterialIcons name="add" size={32} color={colors.primary} />
            <Text style={styles.addText}>Add Role</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editingIndex !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Role</Text>
            <TextInput 
                style={styles.input} 
                value={editName} 
                onChangeText={setEditName} 
                autoFocus
                placeholder="Role Name"
            />
            <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.deleteBtn]} onPress={handleDelete}>
                    <Text style={{ color: colors.notification, fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WizardLayout>
  );
}
