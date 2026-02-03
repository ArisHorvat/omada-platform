import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, GlassView, Icon, SegmentedControl, AppButton } from '@/src/components/ui';
import { useUsersImportLogic } from '../hooks/useUsersImportLogic';

export default function UsersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { importedUsers, submitRegistration, isSubmitting, activeTab, setActiveTab, handleInviteLink, pickDocument } = useUsersImportLogic();

  // Helper to convert tabs
  const tabIndex = activeTab === 'email' ? 0 : 1;
  const handleTabChange = (idx: number) => setActiveTab(idx === 0 ? 'email' : 'upload');

  return (
    <WizardLayout 
        step={5} 
        totalSteps={6} 
        title="Add Users" 
        subtitle="Invite your team"
        onBack={() => router.back()} 
        onNext={submitRegistration} 
        nextLabel={isSubmitting ? "Creating Organization..." : "Finish Setup"}
        isNextDisabled={isSubmitting}
        isNextLoading={isSubmitting}
    >
      <View style={{ marginBottom: 24 }}>
        <SegmentedControl 
            options={['Invite via Email', 'Bulk Upload']}
            selectedIndex={tabIndex}
            onChange={handleTabChange}
        />
      </View>

      {activeTab === 'email' ? (
          <GlassView intensity={10} style={{ padding: 24, borderRadius: 20, alignItems: 'center', gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mail" size={32} color={colors.primary} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <AppText variant="h3">Share Magic Link</AppText>
                <AppText style={{ textAlign: 'center', color: colors.subtle, marginTop: 8 }}>
                    We'll generate a secure link. Anyone with this link can join your organization.
                </AppText>
              </View>
              <AppButton 
                title="Generate & Share Link" 
                variant="outline" 
                onPress={handleInviteLink} 
                style={{ width: '100%' }}
                icon="share"
              />
          </GlassView>
      ) : (
          <GlassView intensity={10} style={{ padding: 24, borderRadius: 20, alignItems: 'center', gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="cloud-upload" size={32} color={colors.secondary} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <AppText variant="h3">Upload CSV</AppText>
                <AppText style={{ textAlign: 'center', color: colors.subtle, marginTop: 8 }}>
                    Upload a spreadsheet with columns: First Name, Last Name, Email, Role.
                </AppText>
              </View>
              <AppButton 
                title="Select File" 
                variant="outline" 
                onPress={pickDocument} 
                style={{ width: '100%' }}
              />
          </GlassView>
      )}

      {/* Imported Users List */}
      {importedUsers.length > 0 && (
          <View style={{ marginTop: 24 }}>
              <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>READY TO IMPORT ({importedUsers.length})</AppText>
              {importedUsers.map((u, idx) => (
                  <GlassView key={idx} intensity={15} style={{ padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <AppText style={{ color: colors.background, fontWeight: 'bold' }}>{u.firstName?.charAt(0)}</AppText>
                      </View>
                      <View>
                          <AppText weight="bold">{u.firstName} {u.lastName}</AppText>
                          <AppText variant="caption" style={{ color: colors.subtle }}>{u.role}</AppText>
                      </View>
                  </GlassView>
              ))}
          </View>
      )}

    </WizardLayout>
  );
}