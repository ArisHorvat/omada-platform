import React from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, ClayView, Icon, IconInput, AppButton } from '@/src/components/ui';
import { useRolesLogic } from '../hooks/useRolesLogic';

export default function RolesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { roles, orgData, editingIndex, editName, setEditName, handleAdd, handleEdit, handleSave, handleDelete } = useRolesLogic();

  return (
    <WizardLayout 
        step={3} totalSteps={6} title="Define Roles" subtitle={`Roles for ${orgData.type} Structure`}
        onBack={() => router.back()} onNext={() => router.push('/register-flow/widgets')}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {roles.map((role, index) => (
            <TouchableOpacity key={index} style={{ width: '48%' }} onPress={() => handleEdit(index)}>
              <ClayView style={{ 
                  padding: 12, 
                  borderRadius: 20, 
                  height: 150, 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: colors.card 
              }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="badge" size={24} color={colors.primary} />
                    </View>
                </View>
                
                <View style={{ height: 40, justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
                    <AppText weight="bold" numberOfLines={2} style={{ textAlign: 'center', fontSize: 14, lineHeight: 18 }}>
                        {role}
                    </AppText>
                </View>
              </ClayView>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={{ width: '48%' }} onPress={handleAdd}>
              <ClayView style={{ 
                  padding: 12, 
                  borderRadius: 20, 
                  height: 150,
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  backgroundColor: colors.background, 
                  borderWidth: 2, 
                  borderColor: colors.primary, 
                  borderStyle: 'dashed' 
              }}>
                <Icon name="add" size={32} color={colors.primary} />
                <AppText weight="bold" style={{ color: colors.primary, marginTop: 8 }}>Add Role</AppText>
              </ClayView>
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
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
            <View style={styles.modalWrapper}>
                {/* 1. CLAYVIEW: The Shell (Background + Shadow) */}
                <ClayView style={{ 
                    borderRadius: 24, 
                    backgroundColor: colors.background,
                    width: '100%',
                    minHeight: 250 // Force height to prevent "pill" collapse
                }}>
                    {/* 2. INNER VIEW: The Padding & Layout */}
                    <View style={{ padding: 24, width: '100%' }}>
                        
                        {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <AppText variant="h3">Edit Role</AppText>
                            <TouchableOpacity onPress={handleSave} hitSlop={16}>
                                <Icon name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Input */}
                        <View style={{ marginBottom: 24 }}>
                            <IconInput 
                                icon="badge"
                                placeholder="Role Name"
                                value={editName}
                                onChangeText={setEditName}
                                autoFocus
                            />
                        </View>

                        {/* Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <AppButton 
                                    title="Delete" 
                                    variant="outline" 
                                    onPress={handleDelete}
                                    style={{ borderColor: colors.error, width: '100%' }}
                                    textStyle={{ color: colors.error }}
                                    icon="delete"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppButton 
                                    title="Save" 
                                    onPress={handleSave}
                                    style={{ width: '100%' }}
                                    icon="check"
                                />
                            </View>
                        </View>

                    </View>
                </ClayView>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center', // Centers the wrapper horizontally & vertically
        padding: 24
    },
    modalWrapper: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center'
    }
});