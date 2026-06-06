import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi, orgApi, usersApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import {
  InviteCodeRequest,
  JoinOrganizationRequest,
  JoinWithInviteCodeRequest,
  LoginRequest,
  OrganizationInvitePreviewDto,
} from '@/src/api/generatedClient';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';
import { homeHrefForRole } from '@/src/utils/authRoutes';
import { joinAccountSchema, validatePassword } from '@/src/utils/passwordValidation';

export type JoinMode = 'invite' | 'open';

export type JoinPhase =
  | 'loading'
  | 'register'
  | 'signIn'
  | 'acceptDecline'
  | 'openJoin'
  | 'success'
  | 'openJoinSuccess'
  | 'alreadyMember'
  | 'wrongAccount'
  | 'expiredInvite';

function normalizeParam(value: string | string[] | undefined): string {
  if (value == null) return '';
  const raw = Array.isArray(value) ? value[0] : value;
  return raw == null || raw === 'null' || raw === 'undefined' ? '' : String(raw).trim();
}

function resolvePhase(
  mode: JoinMode,
  preview: OrganizationInvitePreviewDto | null,
  isSignedIn: boolean,
  isLoadingPreview: boolean,
  hasInviteCode: boolean,
  hasSetupToken: boolean,
  hasPending: boolean,
): JoinPhase {
  if (hasInviteCode && isLoadingPreview && !preview) return 'loading';
  if (preview?.isAlreadyMember) return 'alreadyMember';
  if (preview?.inviteLinkExpired) return 'expiredInvite';

  if (mode === 'open') {
    if (hasPending) return 'acceptDecline';
    return 'openJoin';
  }

  if (isSignedIn) {
    if (preview?.requiresRegistration) return 'wrongAccount';
    if (hasPending) return 'acceptDecline';
    if (preview && hasInviteCode) return 'alreadyMember';
  }

  if (!isSignedIn && (preview?.requiresRegistration || hasSetupToken)) return 'register';
  if (!isSignedIn && preview?.requiresSignIn) return 'signIn';
  return 'register';
}

export const useJoinOrganizationLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; token?: string; email?: string; mode?: string }>();
  const queryClient = useQueryClient();
  const { login, addSession, activeSession } = useAuth();
  const isSignedIn = !!activeSession;

  const joinMode: JoinMode = normalizeParam(params.mode) === 'open' ? 'open' : 'invite';
  const initialCode = normalizeParam(params.code);
  const setupToken = normalizeParam(params.token);
  const prefillEmail = normalizeParam(params.email);

  const [inviteCode, setInviteCode] = useState(initialCode);
  const [preview, setPreview] = useState<OrganizationInvitePreviewDto | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [passwordHint, setPasswordHint] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{ organizationName: string; email: string } | null>(null);
  const [openJoinSuccess, setOpenJoinSuccess] = useState<{ organizationName: string; pending?: boolean } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: isSignedIn,
  });

  const pendingInvitesQuery = useQuery({
    queryKey: ['pendingInvites'],
    queryFn: () => unwrap(authApi.getPendingInvites()),
    enabled: isSignedIn,
  });

  const sessionEmail = activeSession?.email ?? profileQuery.data?.email ?? '';
  const previewLookupEmail = isSignedIn ? sessionEmail : prefillEmail || email;

  const pendingForCode = useMemo(() => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return null;
    return pendingInvitesQuery.data?.find((item) => item.inviteCode?.toUpperCase() === code) ?? null;
  }, [pendingInvitesQuery.data, inviteCode]);

  const hasPending = !!(preview?.hasPendingInvite || pendingForCode);

  useEffect(() => {
    if (profileQuery.data && isSignedIn) {
      setEmail(profileQuery.data.email ?? activeSession?.email ?? '');
    }
  }, [profileQuery.data, isSignedIn, activeSession?.email]);

  useEffect(() => {
    if (initialCode) setInviteCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!preview || isSignedIn) return;
    if (preview.invitedFirstName) setFirstName(preview.invitedFirstName);
    if (preview.invitedLastName) setLastName(preview.invitedLastName);
    if (preview.invitedEmail) setEmail(preview.invitedEmail);
  }, [preview?.organizationId, preview?.invitedEmail, isSignedIn]);

  const loadPreview = useCallback(
    async (code: string, emailForLookup?: string) => {
      const normalized = code.trim().toUpperCase();
      if (normalized.length < 4) {
        setPreview(null);
        return;
      }
      setIsLoadingPreview(true);
      try {
        const result = isSignedIn
          ? await unwrap(authApi.getInvitePreviewForCurrentUser(normalized))
          : await unwrap(orgApi.getInvitePreview(normalized, emailForLookup?.trim() || undefined));
        setPreview(result ?? null);
      } catch {
        setPreview((current) => current);
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [isSignedIn],
  );

  useEffect(() => {
    const code = (initialCode || inviteCode).trim();
    if (code.length < 4) return;
    void loadPreview(code, previewLookupEmail);
  }, [initialCode, previewLookupEmail, loadPreview, isSignedIn]);

  const onInviteCodeBlur = () => {
    void loadPreview(inviteCode, isSignedIn ? undefined : email);
  };

  const onEmailBlur = () => {
    if (isSignedIn || !email.trim()) return;
    void loadPreview(inviteCode, email);
  };

  const phase = useMemo(() => {
    if (successInfo) return 'success' as const;
    if (openJoinSuccess) return 'openJoinSuccess' as const;
    return resolvePhase(
      joinMode,
      preview,
      isSignedIn,
      isLoadingPreview,
      !!inviteCode.trim(),
      !!setupToken,
      hasPending,
    );
  }, [
    joinMode,
    preview,
    isSignedIn,
    isLoadingPreview,
    inviteCode,
    successInfo,
    openJoinSuccess,
    setupToken,
    hasPending,
  ]);

  const completeJoin = async (response: { accessToken?: string; refreshToken?: string; role?: string }) => {
    if (!response.accessToken) throw new Error('Missing access token after join.');
    if (isSignedIn) {
      await addSession(response.accessToken, response.refreshToken);
    } else {
      await login(response.accessToken, response.refreshToken);
    }
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myOrganizations });
    router.replace(homeHrefForRole(response.role) as never);
  };

  const handleAcceptInvite = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Missing code', 'Enter the organization invite code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const request = InviteCodeRequest.fromJS({ inviteCode: code });
      const response = await unwrap(authApi.acceptInvite(request));
      await completeJoin(response);
    } catch (error: unknown) {
      Alert.alert('Could not join', formatApiErrorMessage(error, 'Could not accept the invite.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineInvite = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setIsSubmitting(true);
    try {
      const request = InviteCodeRequest.fromJS({ inviteCode: code });
      await unwrap(authApi.declineInvite(request));
      Alert.alert('Invite declined', 'You will not be added to this organization.');
      if (router.canGoBack()) router.back();
      else router.replace(homeHrefForRole(activeSession?.role) as never);
    } catch (error: unknown) {
      Alert.alert('Could not decline', formatApiErrorMessage(error, 'Could not decline the invite.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || !preview) {
      Alert.alert('Enter a code', 'Type a valid organization code and wait for the preview to load.');
      return;
    }
    if (hasPending) {
      await handleAcceptInvite();
      return;
    }
    setIsSubmitting(true);
    try {
      const request = JoinWithInviteCodeRequest.fromJS({ inviteCode: code });
      const result = await unwrap(authApi.joinWithCurrentUser(request));

      if (result.status === 'PendingApproval') {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myOrganizations });
        setOpenJoinSuccess({ organizationName: result.organizationName ?? preview.name ?? 'the organization', pending: true });
        return;
      }

      const session = result.session;
      if (!session?.accessToken) throw new Error('Missing session after join.');

      if (isSignedIn) {
        await addSession(session.accessToken, session.refreshToken);
      } else {
        await login(session.accessToken, session.refreshToken);
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myOrganizations });
      setOpenJoinSuccess({ organizationName: result.organizationName ?? preview.name ?? 'the organization' });
    } catch (error: unknown) {
      Alert.alert('Could not join', formatApiErrorMessage(error, 'Could not join organization.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInToJoin = async (signInEmail: string, signInPassword: string) => {
    setIsSubmitting(true);
    try {
      const loginRequest = LoginRequest.fromJS({ email: signInEmail.trim(), password: signInPassword });
      const loginResponse = await unwrap(authApi.login(loginRequest));
      await login(loginResponse.accessToken!, loginResponse.refreshToken);
      setShowSignInModal(false);
    } catch (error: unknown) {
      Alert.alert('Sign in failed', formatApiErrorMessage(error, 'Could not sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccountAndJoin = async () => {
    const parsed = joinAccountSchema.safeParse({ firstName, lastName, email, password, confirmPassword });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      });
      setFormErrors(next);
      return;
    }
    setFormErrors({});

    if (preview?.requiresSignIn && !isSignedIn) {
      setShowSignInModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const request = JoinOrganizationRequest.fromJS({
        inviteCode: inviteCode.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        setupToken: setupToken || undefined,
      });
      const result = await unwrap(authApi.joinOrganization(request));
      setSuccessInfo({
        organizationName: result.organizationName,
        email: result.email,
      });
    } catch (error: unknown) {
      Alert.alert('Could not join', formatApiErrorMessage(error, 'Could not join organization.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToSignIn = () => {
    router.replace('/login-flow' as never);
  };

  const goToApp = () => {
    router.replace(homeHrefForRole(activeSession?.role) as never);
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setPasswordHint(value.length > 0 ? validatePassword(value) : null);
  };

  const signedInName = profileQuery.data
    ? `${profileQuery.data.firstName ?? ''} ${profileQuery.data.lastName ?? ''}`.trim()
    : activeSession?.email?.split('@')[0] ?? 'your account';

  const emailLocked = !!setupToken || !!preview?.requiresRegistration;

  return {
    joinMode,
    inviteCode,
    setInviteCode,
    preview,
    previewName: preview?.name ?? pendingForCode?.organizationName ?? null,
    isLoadingPreview,
    isSubmitting,
    isSignedIn,
    signedInName,
    signedInEmail: sessionEmail || email,
    invitedEmail: preview?.invitedEmail ?? prefillEmail,
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
  };
};
