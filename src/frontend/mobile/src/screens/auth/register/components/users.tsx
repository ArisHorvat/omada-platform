import React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, ClayView, Icon, SegmentedControl, AppButton } from '@/src/components/ui';
import { useUsersImportLogic } from '../hooks/useUsersImportLogic';

export default function UsersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  
  // Destructure our new exports
  const { 
    importedUsers, submitRegistration, isSubmitting, activeTab, 
    setActiveTab, handleInviteLink, pickDocument, isLoading,
    roles, defaultUserPassword
  } = useUsersImportLogic();

  return (
    <WizardLayout 
        step={5} totalSteps={6} title="Add Users" subtitle="Invite your team"
        onBack={() => router.back()} onNext={submitRegistration} nextLabel={isSubmitting ? "Creating..." : "Finish"}
        isNextDisabled={isSubmitting || isLoading} isNextLoading={isSubmitting || isLoading}
    >
      <View style={{ marginBottom: 24 }}>
        <SegmentedControl options={['Invite Link', 'Bulk Upload']} selectedIndex={activeTab === 'email' ? 0 : 1} onChange={(i) => setActiveTab(i===0?'email':'upload')} />
      </View>

      {activeTab === 'email' ? (
          <ClayView style={{ padding: 24, borderRadius: 24, alignItems: 'center', backgroundColor: colors.card }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name="link" size={32} color={colors.primary} />
              </View>
              <AppText variant="h3">Share Magic Link</AppText>
              <AppText style={{ textAlign: 'center', color: colors.subtle, marginVertical: 8 }}>Anyone with this link can join instantly.</AppText>
              <AppButton title="Generate Link" variant="outline" onPress={handleInviteLink} style={{ width: '100%' }} icon="share" />
          </ClayView>
      ) : (
          <View style={{ gap: 16 }}>
              {/* Main Upload Box */}
              <ClayView style={{ padding: 24, borderRadius: 24, alignItems: 'center', backgroundColor: colors.card }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon name="cloud-upload" size={32} color={colors.secondary} />
                  </View>
                  <AppText variant="h3">Upload CSV</AppText>
                  <AppText style={{ textAlign: 'center', color: colors.subtle, marginVertical: 8 }}>
                    Columns must exactly match: FirstName, LastName, Email, Role
                  </AppText>
                  <AppButton 
                     title={isLoading ? "Parsing..." : "Select File"} 
                     variant="outline" onPress={pickDocument} 
                     style={{ width: '100%' }} disabled={isLoading} 
                  />
              </ClayView>

              {/* Password Info Banner */}
              <ClayView style={{ padding: 16, borderRadius: 16, backgroundColor: colors.primaryContainer, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                 <Icon name="info" size={24} color={colors.primary} />
                 <View style={{ flex: 1 }}>
                     <AppText variant="caption" weight="bold" style={{ color: colors.onPrimaryContainer }}>DEFAULT PASSWORD</AppText>
                     <AppText variant="caption" style={{ color: colors.onPrimaryContainer, opacity: 0.8 }}>
                        Imported users will sign in using: <AppText weight="bold" style={{ color: colors.primary }}>{defaultUserPassword}</AppText>
                     </AppText>
                 </View>
              </ClayView>

              {/* Dynamic CSV Template Preview */}
              <ClayView style={{ padding: 16, borderRadius: 16, backgroundColor: colors.background }}>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>CSV TEMPLATE PREVIEW</AppText>
                  
                  {/* Header Row */}
                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 8 }}>
                     <AppText variant="caption" weight="bold" style={{ flex: 1 }}>FirstName</AppText>
                     <AppText variant="caption" weight="bold" style={{ flex: 1 }}>LastName</AppText>
                     <AppText variant="caption" weight="bold" style={{ flex: 1.5 }}>Email</AppText>
                     <AppText variant="caption" weight="bold" style={{ flex: 1 }}>Role</AppText>
                  </View>
                  
                  {/* Generated Rows based on their chosen roles! */}
                  {roles.slice(0, 4).map((role, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', marginBottom: 6 }}>
                         <AppText variant="caption" style={{ flex: 1, color: colors.text }}>Jane</AppText>
                         <AppText variant="caption" style={{ flex: 1, color: colors.text }}>Doe</AppText>
                         <AppText variant="caption" style={{ flex: 1.5, color: colors.subtle }}>jane{idx}@test.com</AppText>
                         <AppText variant="caption" style={{ flex: 1, color: colors.secondary }}>{role}</AppText>
                      </View>
                  ))}
                  {roles.length > 4 && (
                      <AppText variant="caption" style={{ color: colors.subtle, fontStyle: 'italic', marginTop: 4 }}>
                         ... and {roles.length - 4} more roles
                      </AppText>
                  )}
              </ClayView>
          </View>
      )}

      {/* Render the actual imported users if the array has data */}
      {importedUsers.length > 0 && (
          <View style={{ marginTop: 24 }}>
              <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>READY TO IMPORT ({importedUsers.length})</AppText>
              {importedUsers.map((u, idx) => (
                  <ClayView key={idx} style={{ padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <AppText style={{ color: '#FFF', fontWeight: 'bold' }}>{u.firstName?.charAt(0)}</AppText>
                      </View>
                      <View>
                          <AppText weight="bold">{u.firstName} {u.lastName}</AppText>
                          <AppText variant="caption" style={{ color: colors.subtle }}>{u.email} • {u.role}</AppText>
                      </View>
                  </ClayView>
              ))}
          </View>
      )}
    </WizardLayout>
  );
}