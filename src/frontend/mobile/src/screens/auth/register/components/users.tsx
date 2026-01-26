import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { WizardLayout } from '@/src/components/WizardLayout';
import { FormInput } from '@/src/components/FormInput';
import { createStyles } from '@/src/screens/auth/register/styles/users.styles';
import { useUsersImportLogic } from '../hooks/useUsersImportLogic';

export default function UsersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { importedUsers, submitRegistration, isSubmitting, defaultUserPassword, setDefaultUserPassword, activeTab, setActiveTab, isLoading, handleInviteLink, pickDocument } = useUsersImportLogic();

  const renderContent = () => {
    switch (activeTab) {
        case 'email':
            return (
                <View style={styles.emailCard}>
                    <View style={styles.emailIcon}><MaterialIcons name="email" size={40} color={colors.primary} /></View>
                    <Text style={styles.emailTitle}>Invite via Email</Text>
                    <Text style={styles.emailDesc}>We'll generate a magic link you can share with your team to let them join automatically.</Text>
                    <TouchableOpacity style={styles.emailBtn} onPress={handleInviteLink}>
                        <Text style={styles.emailBtnText}>Copy Invite Link</Text>
                    </TouchableOpacity>
                </View>
            );
        case 'upload':
            return (
                <View>
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                        {isLoading ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="cloud-upload" size={32} color={colors.subtle} />}
                        <Text style={{ marginLeft: 12, color: colors.subtle, fontWeight: '600' }}>{isLoading ? 'Extracting...' : 'Tap to upload CSV/Excel'}</Text>
                    </TouchableOpacity>
                    
                    <View style={{ marginTop: 24 }}>
                        <FormInput 
                            label="Default Password for New Users" 
                            placeholder="Welcome123!" 
                            value={defaultUserPassword} 
                            onChangeText={setDefaultUserPassword} 
                            styles={{ inputGroup: { marginBottom: 16 }, label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }, input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text } }}
                            description="Users will be prompted to change this on first login."
                        />
                    </View>

                    <Text style={{ marginTop: 16, fontWeight: 'bold', color: colors.text }}>Imported Users ({importedUsers.length})</Text>
                    {isLoading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ marginTop: 10, color: colors.subtle }}>Processing file...</Text>
                        </View>
                    ) : importedUsers.map((u, i) => (
                        <View key={i} style={styles.userCard}>
                            <View style={styles.userAvatar}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>{u.firstName?.charAt(0) || 'U'}</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{u.firstName} {u.lastName}</Text>
                                <Text style={styles.userEmail}>{u.email}</Text>
                                <Text style={styles.userRole}>{u.role}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            );
    }
  };

  return (
    <WizardLayout 
        step={6} 
        totalSteps={6} 
        title="Add Users" 
        onBack={() => router.back()} 
        onNext={submitRegistration} 
        nextLabel={isSubmitting ? "Creating..." : "Finish"}
        isNextDisabled={isSubmitting}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabs}>
            {(['email', 'upload'] as const).map(t => (
                <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                    <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                        {t === 'email' ? 'Email Link' : 'Upload'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
        {renderContent()}
      </ScrollView>
    </WizardLayout>
  );
}
