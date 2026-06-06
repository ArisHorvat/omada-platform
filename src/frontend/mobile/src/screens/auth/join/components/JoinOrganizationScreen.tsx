import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, ClayView, AppButton, Icon, ProgressiveImage } from '@/src/components/ui';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';
import { useJoinOrganizationLogic } from '../hooks/useJoinOrganizationLogic';
import { SignInToJoinModal } from './SignInToJoinModal';

const useKeyboardAvoiding = Platform.OS === 'ios' || Platform.OS === 'android';

export default function JoinOrganizationScreen({ inApp = false }: { inApp?: boolean }) {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    joinMode,
    inviteCode,
    setInviteCode,
    preview,
    previewName,
    isLoadingPreview,
    isSubmitting,
    isSignedIn,
    signedInName,
    signedInEmail,
    invitedEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    confirmPassword,
    setConfirmPassword,
    onPasswordChange,
    passwordHint,
    formErrors,
    setupToken,
    phase,
    successInfo,
    openJoinSuccess,
    emailLocked,
    showSignInModal,
    setShowSignInModal,
    onInviteCodeBlur,
    onEmailBlur,
    handleAcceptInvite,
    handleDeclineInvite,
    handleOpenJoin,
    handleSignInToJoin,
    handleCreateAccountAndJoin,
    goToSignIn,
    goToApp,
  } = useJoinOrganizationLogic();

  const logoUri = resolveMediaUrl(preview?.logoUrl);
  const isOpenMode = joinMode === 'open';

  const headerTitle =
    phase === 'success'
      ? 'You are all set'
      : phase === 'openJoinSuccess'
        ? openJoinSuccess?.pending
          ? 'Request submitted'
          : 'Welcome aboard'
        : phase === 'acceptDecline'
          ? 'Organization invite'
          : phase === 'wrongAccount'
            ? 'Different account'
            : phase === 'expiredInvite'
              ? 'Invite expired'
              : phase === 'signIn'
                ? 'Sign in to join'
                : isOpenMode
                  ? 'Join organization'
                  : 'Join organization';

  const headerSubtitle =
    phase === 'success'
      ? 'Your account is ready. Sign in to start using Omada.'
      : phase === 'openJoinSuccess'
        ? openJoinSuccess?.pending
          ? `An admin at ${openJoinSuccess?.organizationName ?? 'the organization'} will review your request.`
          : `You are now a member of ${openJoinSuccess?.organizationName ?? 'the organization'}.`
        : phase === 'acceptDecline'
          ? 'You have a pending invite. Accept to join or decline to stay where you are.'
          : phase === 'wrongAccount'
            ? `This invite is for ${invitedEmail || 'another email'}. Sign out and open the link again to finish setup.`
            : phase === 'expiredInvite'
              ? 'This setup link has expired. Ask your organization admin to resend the invitation.'
              : phase === 'signIn'
                ? 'This invite is linked to an existing Omada account. Sign in to continue.'
                : phase === 'openJoin'
                  ? 'Enter an organization code to find the workspace and join.'
                  : phase === 'register' && previewName
                    ? `Complete your profile to join ${previewName}.`
                    : 'Enter the code from your invite email or organization admin.';

  const orgPreviewBlock =
    previewName && !isLoadingPreview ? (
      <ClayView style={[styles.orgPreview, { backgroundColor: colors.primaryContainer }]}>
        {logoUri ? (
          <ProgressiveImage source={{ uri: logoUri }} style={styles.orgLogo} resizeMode="cover" />
        ) : (
          <Icon name="business" size={28} color={colors.primary} />
        )}
        <View style={{ flex: 1 }}>
          <AppText weight="bold">{previewName}</AppText>
          <AppText variant="caption" style={{ color: colors.subtle }}>
                      {phase === 'alreadyMember'
                        ? 'You are already a member — switch into this workspace'
                        : phase === 'acceptDecline'
                ? 'Pending invite — waiting for your response'
                : 'You will join this organization'}
          </AppText>
        </View>
      </ClayView>
    ) : null;

  const formBody = (
    <>
      {phase === 'success' && successInfo ? (
        <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={48} color={colors.primary} />
          </View>
          <AppText weight="bold" style={{ textAlign: 'center', marginTop: 12 }}>
            Welcome to {successInfo.organizationName}
          </AppText>
          <AppText style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
            Account created for {successInfo.email}. Sign in with your new password to continue.
          </AppText>
          <AppButton title="Go to sign in" onPress={goToSignIn} variant="primary" size="lg" style={{ marginTop: 24 }} />
        </ClayView>
      ) : phase === 'openJoinSuccess' ? (
        <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={48} color={colors.primary} />
          </View>
          <AppText weight="bold" style={{ textAlign: 'center', marginTop: 12 }}>
            {openJoinSuccess?.pending ? 'Waiting for approval' : `Joined ${openJoinSuccess?.organizationName}`}
          </AppText>
          <AppText style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
            {openJoinSuccess?.pending
              ? 'You will get access once an administrator approves your request and assigns your role.'
              : 'Your workspace has been updated. Continue to the app.'}
          </AppText>
          <AppButton
            title={openJoinSuccess?.pending ? 'Back to app' : 'Continue'}
            onPress={goToApp}
            variant="primary"
            size="lg"
            style={{ marginTop: 24 }}
          />
        </ClayView>
      ) : (
        <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
          {phase !== 'acceptDecline' && phase !== 'wrongAccount' && phase !== 'expiredInvite' ? (
            <>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                ORGANIZATION CODE
              </AppText>
              <TextInput
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                onBlur={onInviteCodeBlur}
                placeholder="e.g. AB12CD34"
                placeholderTextColor={colors.subtle}
                autoCapitalize="characters"
                editable={!setupToken || isOpenMode}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
            </>
          ) : null}

          {isLoadingPreview ? (
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
              Checking code…
            </AppText>
          ) : null}

          {orgPreviewBlock}

          {phase === 'wrongAccount' ? (
            <ClayView style={[styles.signedInBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <AppText weight="bold">Signed in as {signedInEmail}</AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                Invite sent to {invitedEmail || 'another address'}
              </AppText>
            </ClayView>
          ) : null}

          {phase === 'expiredInvite' ? (
            <AppButton title="Back to sign in" onPress={goToSignIn} variant="outline" size="lg" style={{ marginTop: 20 }} />
          ) : null}

          {phase === 'alreadyMember' ? (
            <AppButton
              title={isOpenMode ? 'Switch to this organization' : 'Go to app'}
              onPress={isOpenMode ? handleOpenJoin : () => router.replace('/dashboard' as never)}
              loading={isOpenMode && isSubmitting}
              style={{ marginTop: 20 }}
            />
          ) : null}

          {phase === 'acceptDecline' ? (
            <>
              <ClayView style={[styles.signedInBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <AppText weight="bold">{signedInName}</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                  {signedInEmail}
                </AppText>
              </ClayView>
              <AppButton
                title={isSubmitting ? 'Joining…' : 'Accept invite'}
                onPress={handleAcceptInvite}
                loading={isSubmitting}
                variant="primary"
                size="lg"
                style={{ marginTop: 20 }}
                disabled={!inviteCode.trim() || !previewName}
              />
              <AppButton
                title="Decline"
                onPress={handleDeclineInvite}
                variant="outline"
                size="lg"
                style={{ marginTop: 10 }}
                disabled={isSubmitting}
              />
            </>
          ) : null}

          {phase === 'openJoin' ? (
            <AppButton
              title={isSubmitting ? 'Joining…' : 'Join organization'}
              onPress={handleOpenJoin}
              loading={isSubmitting}
              variant="primary"
              size="lg"
              style={{ marginTop: 20 }}
              disabled={!inviteCode.trim() || !previewName || isLoadingPreview}
            />
          ) : null}

          {phase === 'register' ? (
            <>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 20, marginBottom: 8 }}>
                YOUR DETAILS
              </AppText>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  formErrors.firstName ? { borderColor: colors.error } : { borderColor: colors.border },
                  { color: colors.text, backgroundColor: colors.background },
                ]}
              />
              {formErrors.firstName ? (
                <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {formErrors.firstName}
                </AppText>
              ) : null}
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  formErrors.lastName ? { borderColor: colors.error } : null,
                ]}
              />
              {formErrors.lastName ? (
                <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {formErrors.lastName}
                </AppText>
              ) : null}
              <TextInput
                value={email}
                onChangeText={setEmail}
                onBlur={onEmailBlur}
                placeholder="Email"
                placeholderTextColor={colors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailLocked}
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  formErrors.email ? { borderColor: colors.error } : null,
                ]}
              />
              {formErrors.email ? (
                <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {formErrors.email}
                </AppText>
              ) : null}
              <TextInput
                value={password}
                onChangeText={onPasswordChange}
                placeholder="Password (8+ chars, uppercase & number)"
                placeholderTextColor={colors.subtle}
                secureTextEntry
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  formErrors.password || passwordHint ? { borderColor: colors.error } : null,
                ]}
              />
              {(passwordHint || formErrors.password) ? (
                <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {formErrors.password ?? passwordHint}
                </AppText>
              ) : null}
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor={colors.subtle}
                secureTextEntry
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  formErrors.confirmPassword ? { borderColor: colors.error } : null,
                ]}
              />
              {formErrors.confirmPassword ? (
                <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {formErrors.confirmPassword}
                </AppText>
              ) : null}
              <AppButton
                title={isSubmitting ? 'Creating account…' : 'Create account & join'}
                onPress={handleCreateAccountAndJoin}
                loading={isSubmitting}
                variant="primary"
                size="lg"
                style={{ marginTop: 24 }}
              />
            </>
          ) : null}

          {phase === 'signIn' && !isSignedIn ? (
            <AppButton
              title="Sign in to continue"
              onPress={() => setShowSignInModal(true)}
              variant="primary"
              size="lg"
              style={{ marginTop: 20 }}
            />
          ) : null}
        </ClayView>
      )}

      {!isSignedIn && phase === 'register' && !setupToken ? (
        <View style={styles.footer}>
          <AppText style={{ color: colors.subtle }}>Already have an account?</AppText>
          <TouchableOpacity onPress={() => setShowSignInModal(true)}>
            <AppText weight="bold" style={{ color: colors.primary, marginTop: 4 }}>
              Sign in to join
            </AppText>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  return (
    <AuthContentShell style={{ flex: 1 }}>
      {useKeyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          {phase !== 'success' && phase !== 'openJoinSuccess' ? (
            <ClayBackButton absolute variant="plain" onPress={() => router.back()} />
          ) : null}
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              <View style={styles.header}>
                <AppText variant="h1" style={{ marginBottom: 8 }}>
                  {headerTitle}
                </AppText>
                <AppText style={{ color: colors.subtle, textAlign: 'center' }}>{headerSubtitle}</AppText>
              </View>
              {formBody}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <>
          {phase !== 'success' && phase !== 'openJoinSuccess' ? (
            <ClayBackButton absolute variant="plain" onPress={() => router.back()} />
          ) : null}
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" style={styles.flex}>
            <View style={styles.container}>
              <View style={styles.header}>
                <AppText variant="h1" style={{ marginBottom: 8 }}>
                  {headerTitle}
                </AppText>
                <AppText style={{ color: colors.subtle, textAlign: 'center' }}>{headerSubtitle}</AppText>
              </View>
              {formBody}
            </View>
          </ScrollView>
        </>
      )}

      <SignInToJoinModal
        visible={showSignInModal}
        organizationName={previewName}
        defaultEmail={email}
        isSubmitting={isSubmitting}
        onClose={() => setShowSignInModal(false)}
        onSubmit={handleSignInToJoin}
      />
    </AuthContentShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  container: { padding: 24, paddingTop: 48 },
  header: { marginBottom: 32, alignItems: 'center' },
  formContainer: { padding: 24, borderRadius: 24, marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14 },
  footer: { alignItems: 'center' },
  orgPreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgLogo: { width: 44, height: 44, borderRadius: 12 },
  signedInBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  successIcon: { alignItems: 'center' },
});
