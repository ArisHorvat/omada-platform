import React, { useMemo } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, GlassView, Icon, IconInput, AppButton } from '@/src/components/ui';
import { useRolesLogic } from '../hooks/useRolesLogic';

const CARD_HEIGHT = 140;

export default function RolesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { 
    roles, 
    orgData, 
    editingIndex, 
    editName, 
    setEditName, 
    handleAdd, 
    handleEdit, 
    handleSave, 
    handleDelete 
  } = useRolesLogic();

  // Helper to pick icons based on role name
  const getRoleIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('student') || lower.includes('intern')) return 'face';
    if (lower.includes('teacher') || lower.includes('professor') || lower.includes('faculty')) return 'school';
    if (lower.includes('admin') || lower.includes('manager') || lower.includes('lead')) return 'security';
    if (lower.includes('hr') || lower.includes('human')) return 'groups';
    if (lower.includes('guest')) return 'person-outline';
    return 'badge'; // default
  };

  return (
    <WizardLayout 
        step={3} 
        totalSteps={6} 
        title="Define Roles" 
        subtitle={`Roles for ${orgData.type === 'university' ? 'Academic' : 'Corporate'} Structure`}
        onBack={() => router.back()} 
        onNext={() => router.push('/register-flow/widgets')}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={{ marginBottom: 24 }}>
             <AppText style={{ color: colors.subtle }}>
                We've pre-filled some standard roles for you. Tap any card to edit, or add new ones.
             </AppText>
        </View>
        
        {/* GRID LAYOUT */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          
          {/* 1. Existing Roles */}
          {roles.map((role, index) => (
            <TouchableOpacity 
                key={index} 
                style={{ width: '48%' }} // 2 Columns
                onPress={() => handleEdit(index)}
                activeOpacity={0.7}
            >
              <GlassView 
                intensity={20}
                style={{
                    padding: 16,
                    borderRadius: 20,
                    height: CARD_HEIGHT, 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderWidth: 1,
                    borderColor: colors.border
                }}
              >
                <View style={{ 
                    width: 40, height: 40, borderRadius: 20, 
                    backgroundColor: colors.primary + '15', 
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12
                }}>
                  <Icon name={getRoleIcon(role)} size={28} color={colors.primary} />
                </View>
                
                <View>
                    {/* FIXED: Limits text to 2 lines and adds '...' */}
                    <AppText 
                        weight="bold" 
                        style={{ fontSize: 15 }}
                        numberOfLines={1} 
                        adjustsFontSizeToFit={false} // Ensure ellipse shows instead of shrinking too small
                    >
                        {role}
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>Tap to edit</AppText>
                </View>
              </GlassView>
            </TouchableOpacity>
          ))}
          
          {/* 2. Add New Role Button */}
          <TouchableOpacity 
             style={{ width: '48%' }}
             onPress={handleAdd}
             activeOpacity={0.7}
          >
              <GlassView 
                intensity={10}
                style={{
                    padding: 16,
                    borderRadius: 20,
                    height: CARD_HEIGHT, // <--- MATCHES ROLE CARD EXACTLY
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                    backgroundColor: colors.primary + '05'
                }}
              >
                <Icon name="add" size={32} color={colors.primary} />
                <AppText weight="bold" style={{ color: colors.primary, marginTop: 8 }}>Add Role</AppText>
              </GlassView>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal 
        visible={editingIndex !== null} 
        transparent 
        animationType="fade"
        onRequestClose={handleSave} 
      >
        <View style={styles.modalOverlay}>
            <GlassView intensity={40} style={[styles.modalContent, { backgroundColor: colors.background }]}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <AppText variant="h3">Edit Role</AppText>
                    <TouchableOpacity onPress={handleSave}>
                        <Icon name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <IconInput 
                    icon="badge"
                    placeholder="Role Name"
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                    <View style={{ flex: 1 }}>
                        <AppButton 
                            title="Delete" 
                            variant="outline" 
                            onPress={handleDelete}
                            style={{ borderColor: colors.error }}
                            textStyle={{ color: colors.error }}
                            icon="delete"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppButton 
                            title="Save" 
                            onPress={handleSave}
                            icon="check"
                        />
                    </View>
                </View>
            </GlassView>
        </View>
      </Modal>

    </WizardLayout>
  );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24
    },
    modalContent: {
        padding: 24,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    }
});