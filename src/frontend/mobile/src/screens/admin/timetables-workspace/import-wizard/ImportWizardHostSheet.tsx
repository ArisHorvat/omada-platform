import React, { useEffect, useMemo, useState } from 'react';

import { ScrollView, View } from 'react-native';



import { InviteMemberItemDto, InviteMembersRequest } from '@/src/api/generatedClient';

import { orgAdminApi, unwrap } from '@/src/api';

import { AppButton, AppFormField, AppText, ClayView, Icon } from '@/src/components/ui';

import { BottomSheet } from '@/src/components/ui/BottomSheet';

import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';

import { PressClay } from '@/src/components/animations';

import { groupsWorkspaceStyles as groupStyles } from '@/src/screens/admin/groups-workspace/styles/groupsWorkspace.styles';

import { useThemeColors } from '@/src/hooks';

import { alertAction } from '@/src/utils/confirmAction';

import { importWizardSheetHeight } from './importWizardSheetLayout';



type Props = {

  visible: boolean;

  scrapedName: string;

  inviteableRoles: string[];

  onClose: () => void;

  onNameOnly: (displayName: string) => void;

};



export function ImportWizardHostSheet({

  visible,

  scrapedName,

  inviteableRoles,

  onClose,

  onNameOnly,

}: Props) {

  const colors = useThemeColors();

  const [email, setEmail] = useState('');

  const [role, setRole] = useState('');

  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const [busy, setBusy] = useState(false);



  useEffect(() => {

    if (!visible) return;

    setEmail('');

    setRole(inviteableRoles[0] ?? 'Member');

  }, [visible, scrapedName, inviteableRoles]);



  const roleOptions = useMemo(

    () => inviteableRoles.map((name) => ({ value: name, label: name })),

    [inviteableRoles],

  );



  const handleInvite = async () => {

    if (!email.trim()) {

      alertAction({ title: 'Email required', message: 'Enter an email to send a pending invite.' });

      return;

    }

    const roleName = role || inviteableRoles[0] || 'Member';

    setBusy(true);

    try {

      await unwrap(

        orgAdminApi.inviteMembers(

          new InviteMembersRequest({

            members: [

              new InviteMemberItemDto({

                email: email.trim(),

                roleName,

              }),

            ],

          }),

        ),

      );

      alertAction({

        title: 'Invite sent',

        message: `Pending invite sent as ${roleName}. Until they join, the pattern can use "${scrapedName}" as host name.`,

      });

      onNameOnly(scrapedName.trim());

      onClose();

    } catch (e) {

      alertAction({

        title: 'Invite failed',

        message: e instanceof Error ? e.message : 'Could not invite member.',

      });

    } finally {

      setBusy(false);

    }

  };



  return (

    <>

      <BottomSheet
        isVisible={visible}
        onClose={onClose}
        height={importWizardSheetHeight(0.82, 480)}
        contentPadding={0}
        zIndexBase={240}
      >

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 10 }}
        >

          <AppText variant="h3" weight="bold">

            Invite teacher

          </AppText>

          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
            Sends a pending org invite for {scrapedName}. Only email and role are required — they complete their
            profile from the invite link.
          </AppText>

          <AppFormField

            label="Email"

            value={email}

            onChangeText={setEmail}

            autoCapitalize="none"

            keyboardType="email-address"

          />

          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>

            Role

          </AppText>

          <PressClay onPress={() => setRolePickerOpen(true)}>

            <ClayView depth={2} color={colors.card} style={groupStyles.selectField}>

              <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>

                {role || inviteableRoles[0] || 'Member'}

              </AppText>

              <Icon name="expand-more" size={22} color={colors.subtle} />

            </ClayView>

          </PressClay>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>

            <AppButton title="Cancel" variant="outline" onPress={onClose} disabled={busy} />

            <AppButton

              title="Name only"

              variant="outline"

              onPress={() => {

                onNameOnly(scrapedName.trim());

                onClose();

              }}

              disabled={busy}

            />

            <AppButton title={busy ? 'Sending…' : 'Send invite'} onPress={handleInvite} disabled={busy} />

          </View>

        </ScrollView>

      </BottomSheet>



      <OptionPickerSheet

        isVisible={rolePickerOpen}

        onClose={() => setRolePickerOpen(false)}

        title="Role"

        options={roleOptions}

        selected={role || null}

        onSelect={(v) => {

          if (v) setRole(v);

        }}

        includeAllOption={false}

        height={importWizardSheetHeight(0.7, 480)}

        zIndexBase={250}

      />

    </>

  );

}


