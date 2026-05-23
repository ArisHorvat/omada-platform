import { useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useRegistrationContext } from '../context/RegistrationContext';
import { useClipboard } from '@/src/hooks';
import { buildOrganizationJoinLink } from '@/src/config/config';
import {
  adminOnboardingEmailPreview,
  memberInvitationEmailPreview,
} from '@/src/constants/inviteEmailTemplates';
import { UserImportDto } from '@/src/api/generatedClient';

export const useOrganizationInviteLogic = () => {
  const {
    importedUsers,
    setImportedUsers,
    submitRegistration,
    isSubmitting,
    roles,
    orgData,
    adminData,
    createdOrgInvite,
  } = useRegistrationContext();

  const { copyToClipboard } = useClipboard();
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState(
    () => roles.find((r) => r.toLowerCase() !== 'admin') ?? roles[0] ?? 'Member',
  );

  const previewInviteCode = createdOrgInvite?.inviteCode ?? 'XXXXXXXX';
  const previewInviteLink =
    createdOrgInvite?.inviteLink ?? buildOrganizationJoinLink(previewInviteCode);

  const inviteableRoles = useMemo(
    () => roles.filter((r) => r.toLowerCase() !== 'admin'),
    [roles],
  );

  const memberEmailTemplate = useMemo(
    () =>
      memberInvitationEmailPreview(
        'Alex',
        orgData.name || 'Your organization',
        previewInviteLink,
        previewInviteCode,
      ),
    [orgData.name, previewInviteCode, previewInviteLink],
  );

  const adminEmailTemplate = useMemo(
    () =>
      adminOnboardingEmailPreview(
        adminData.firstName || 'Admin',
        orgData.name || 'Your organization',
        previewInviteLink,
        previewInviteCode,
      ),
    [adminData.firstName, orgData.name, previewInviteCode, previewInviteLink],
  );

  const addInviteEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      Alert.alert('Email required', 'Enter an email address to invite.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (importedUsers.some((u) => u.email?.toLowerCase() === email)) {
      Alert.alert('Already added', 'This email is already on your invite list.');
      return;
    }

    const localPart = email.split('@')[0] ?? 'Member';
    setImportedUsers([
      ...importedUsers,
      new UserImportDto({
        email,
        role: selectedRole,
        firstName: localPart,
        lastName: '',
      }),
    ]);
    setEmailInput('');
  };

  const removeInviteEmail = (email: string) => {
    setImportedUsers(importedUsers.filter((u) => u.email !== email));
  };

  const copyInviteCode = async () => {
    if (!createdOrgInvite?.inviteCode) {
      Alert.alert('Almost there', 'Finish setup to generate your organization code.');
      return;
    }
    await copyToClipboard(createdOrgInvite.inviteCode);
    Alert.alert('Copied', 'Organization code copied to clipboard.');
  };

  const copyInviteLink = async () => {
    if (!createdOrgInvite?.inviteLink) {
      Alert.alert('Almost there', 'Finish setup to generate your invite link.');
      return;
    }
    await copyToClipboard(createdOrgInvite.inviteLink);
    Alert.alert('Copied', 'Invite link copied to clipboard.');
  };

  const shareInviteLink = async () => {
    const link = createdOrgInvite?.inviteLink ?? previewInviteLink;
    const code = createdOrgInvite?.inviteCode ?? previewInviteCode;
    try {
      await Share.share({
        message: `Join ${orgData.name || 'our organization'} on Omada:\n${link}\n\nOr use code: ${code}`,
      });
    } catch {
      /* user cancelled */
    }
  };

  return {
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
    copyInviteCode,
    copyInviteLink,
    shareInviteLink,
  };
};
