import React from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, ClayView, Icon, SegmentedControl, AppButton, CodeBlock } from '@/src/components/ui';
import { useOrganizationInviteLogic } from '../hooks/useOrganizationInviteLogic';

export default function UsersScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const {
    importedUsers,
    submitRegistration,
    isSubmitting,
    activeTab,
    setActiveTab,
    emailInput,
    setEmailInput,
    selectedRole,
    setSelectedRole,
    inviteableRoles,
    addInviteEmail,
    removeInviteEmail,
    previewInviteCode,
    previewInviteLink,
    createdOrgInvite,
    memberEmailTemplate,
    adminEmailTemplate,
    copyInviteLink,
    shareInviteLink,
  } = useOrganizationInviteLogic();

  return (
    <WizardLayout
      step={5}
      totalSteps={6}
      title="Invite Users"
      subtitle="Share a link, code, or email invites"
      onBack={() => router.back()}
      onNext={submitRegistration}
      nextLabel={isSubmitting ? 'Creating...' : 'Finish'}
      isNextDisabled={isSubmitting}
      isNextLoading={isSubmitting}
    >
      <View style={{ marginBottom: 24 }}>
        <SegmentedControl
          options={['Link & code', 'Email invites']}
          selectedIndex={activeTab === 'link' ? 0 : 1}
          onChange={(i) => setActiveTab(i === 0 ? 'link' : 'email')}
        />
      </View>

      {activeTab === 'link' ? (
        <ClayView style={{ padding: 24, borderRadius: 24, backgroundColor: colors.card, gap: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Icon name="link" size={32} color={colors.primary} />
            </View>
            <AppText variant="h3">Organization invite</AppText>
            <AppText style={{ textAlign: 'center', color: colors.subtle, marginTop: 8 }}>
              {createdOrgInvite
                ? 'Share your link or code so people can register and join.'
                : 'Your unique link and code are generated when you finish this step.'}
            </AppText>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              ORGANIZATION CODE
            </AppText>
            <ClayView
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.background,
                alignItems: 'center',
              }}
            >
              <AppText variant="h2" weight="bold" style={{ letterSpacing: 4 }}>
                {previewInviteCode}
              </AppText>
            </ClayView>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              INVITE LINK
            </AppText>
            <AppText variant="caption" style={{ color: colors.text }} selectable>
              {previewInviteLink}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <AppButton
              title="Copy link"
              variant="outline"
              onPress={copyInviteLink}
              style={{ flex: 1 }}
              icon="content-copy"
              disabled={!createdOrgInvite}
            />
            <AppButton
              title="Share"
              variant="primary"
              onPress={shareInviteLink}
              style={{ flex: 1 }}
              icon="share"
            />
          </View>
        </ClayView>
      ) : (
        <View style={{ gap: 16 }}>
          <ClayView style={{ padding: 20, borderRadius: 24, backgroundColor: colors.card, gap: 12 }}>
            <AppText variant="h3">Invite by email</AppText>
            <AppText style={{ color: colors.subtle }}>
              Each person receives an invitation email with your link and organization code.
            </AppText>

            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="colleague@company.com"
              placeholderTextColor={colors.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
                color: colors.text,
                backgroundColor: colors.background,
              }}
            />

            <AppText variant="caption" style={{ color: colors.subtle }}>
              ROLE
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {inviteableRoles.map((role) => (
                <Pressable key={role} onPress={() => setSelectedRole(role)}>
                  <ClayView
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor:
                        selectedRole === role ? colors.primaryContainer : colors.background,
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight={selectedRole === role ? 'bold' : 'regular'}
                      style={{
                        color: selectedRole === role ? colors.primary : colors.subtle,
                      }}
                    >
                      {role}
                    </AppText>
                  </ClayView>
                </Pressable>
              ))}
            </View>

            <AppButton title="Add to invite list" variant="outline" onPress={addInviteEmail} icon="person-add" />
          </ClayView>

          {importedUsers.length > 0 && (
            <View>
              <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>
                WILL RECEIVE EMAIL ({importedUsers.length})
              </AppText>
              {importedUsers.map((u) => (
                <ClayView
                  key={u.email}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.card,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold">{u.email}</AppText>
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      {u.role}
                    </AppText>
                  </View>
                  <Pressable onPress={() => removeInviteEmail(u.email!)} hitSlop={12}>
                    <Icon name="close" size={20} color={colors.subtle} />
                  </Pressable>
                </ClayView>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={{ marginTop: 24, gap: 16 }}>
        <ClayView style={{ padding: 16, borderRadius: 16, backgroundColor: colors.card }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
            EMAIL TEMPLATE — TEAM MEMBER
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <CodeBlock code={memberEmailTemplate} />
          </ScrollView>
        </ClayView>

        <ClayView style={{ padding: 16, borderRadius: 16, backgroundColor: colors.background }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
            EMAIL TEMPLATE — SENT TO YOU (ADMIN)
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <CodeBlock code={adminEmailTemplate} />
          </ScrollView>
        </ClayView>
      </View>
    </WizardLayout>
  );
}
