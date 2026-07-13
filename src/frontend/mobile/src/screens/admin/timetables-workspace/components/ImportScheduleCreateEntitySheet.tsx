import React, { useEffect, useMemo, useState } from 'react';

import { ScrollView, Switch, View } from 'react-native';



import type { GroupTypeOptionDto } from '@/src/api/generatedClient';

import { AppButton, AppFormField, AppText, ClayView, Icon } from '@/src/components/ui';

import { BottomSheet } from '@/src/components/ui/BottomSheet';

import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';

import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';

import { EventTypeColorPicker } from '@/src/screens/admin/event-types-workspace/components/EventTypeColorPicker';

import { DEFAULT_EVENT_TYPE_COLOR, normalizeEventTypeColor } from '@/src/constants/eventTypeColors';

import { PressClay } from '@/src/components/animations';

import { useThemeColors } from '@/src/hooks';

import { groupsWorkspaceStyles as groupStyles } from '@/src/screens/admin/groups-workspace/styles/groupsWorkspace.styles';

import { importWizardSheetHeight } from '../import-wizard/importWizardSheetLayout';



export type CreateEntityKind = 'eventType' | 'group' | 'room';



type Props = {

  visible: boolean;

  kind: CreateEntityKind | null;

  defaultName: string;

  defaultGroupType?: string | null;

  groupTypeCatalog?: GroupTypeOptionDto[];

  parentGroupOptions?: { value: string; label: string; subtitle?: string }[];

  typeLabelForKey?: (key: string) => string;

  roomUnassignedHint?: boolean;

  onClose: () => void;

  onConfirm: (payload: {

    kind: CreateEntityKind;

    name: string;

    colorHex?: string;

    groupType?: string;

    parentGroupId?: string | null;

    capacity?: number;

    isBookable?: boolean;

  }) => void;

  busy?: boolean;

};



export function ImportScheduleCreateEntitySheet({

  visible,

  kind,

  defaultName,

  defaultGroupType,

  groupTypeCatalog = [],

  parentGroupOptions = [],

  typeLabelForKey,

  roomUnassignedHint = false,

  onClose,

  onConfirm,

  busy = false,

}: Props) {

  const colors = useThemeColors();

  const [name, setName] = useState(defaultName);

  const [colorHex, setColorHex] = useState(DEFAULT_EVENT_TYPE_COLOR);

  const [groupType, setGroupType] = useState(defaultGroupType ?? 'group');

  const [parentGroupId, setParentGroupId] = useState<string | null>(null);

  const [capacity, setCapacity] = useState('30');

  const [isBookable, setIsBookable] = useState(true);

  const [parentPickerOpen, setParentPickerOpen] = useState(false);

  const [typePickerOpen, setTypePickerOpen] = useState(false);



  useEffect(() => {

    if (!visible) return;

    setName(defaultName);

    setColorHex(DEFAULT_EVENT_TYPE_COLOR);

    setGroupType(defaultGroupType ?? 'group');

    setParentGroupId(null);

    setCapacity('30');

    setIsBookable(true);

  }, [visible, defaultName, defaultGroupType]);



  const title = useMemo(() => {

    if (kind === 'eventType') return 'New event type';

    if (kind === 'group') return 'New group';

    return 'New room';

  }, [kind]);



  const hint = useMemo(() => {

    if (kind === 'eventType') return 'Pick a color and name — same as Event types workspace.';

    if (kind === 'group') return 'Choose type and parent group — same as Groups workspace.';

    if (roomUnassignedHint)
      return 'Saved without a location. Assign it under Admin → Locations & maps → pick a level → Unassigned rooms → Assign here.';

    return 'Set capacity and whether members can book this room.';

  }, [kind, roomUnassignedHint]);



  const typePickerOptions = useMemo(

    () =>

      groupTypeCatalog.map((t) => ({

        value: t.key!,

        label: t.label ?? t.key ?? 'Type',

        subtitle: t.description ?? undefined,

      })),

    [groupTypeCatalog],

  );



  const typeLabel = useMemo(() => {

    const match = groupTypeCatalog.find((t) => t.key === groupType);

    return match?.label ?? typeLabelForKey?.(groupType) ?? groupType;

  }, [groupTypeCatalog, groupType, typeLabelForKey]);



  const parentLabel = useMemo(() => {

    if (!parentGroupId) return 'No parent';

    return parentGroupOptions.find((p) => p.value === parentGroupId)?.label ?? 'Parent selected';

  }, [parentGroupId, parentGroupOptions]);



  const sheetHeight = importWizardSheetHeight(kind === 'group' ? 0.92 : 0.85);



  if (!kind) return null;



  return (

    <>

      <BottomSheet isVisible={visible} onClose={onClose} height={sheetHeight} contentPadding={0} zIndexBase={240}>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        >

          <AppText variant="h3" weight="bold">

            {title}

          </AppText>

          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>

            {hint}

          </AppText>



          <AppFormField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />



          {kind === 'eventType' ? (

            <>

              <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>

                COLOR

              </AppText>

              <EventTypeColorPicker value={normalizeEventTypeColor(colorHex)} onChange={setColorHex} />

            </>

          ) : null}



          {kind === 'group' ? (

            <>

              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>

                Group type

              </AppText>

              <PressClay onPress={() => setTypePickerOpen(true)}>

                <ClayView depth={2} color={colors.card} style={[groupStyles.selectField, { marginBottom: 12 }]}>

                  <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>

                    {typeLabel}

                  </AppText>

                  <Icon name="expand-more" size={22} color={colors.subtle} />

                </ClayView>

              </PressClay>



              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>

                Parent group

              </AppText>

              <PressClay onPress={() => setParentPickerOpen(true)}>

                <ClayView depth={2} color={colors.card} style={[groupStyles.selectField, { marginBottom: 8 }]}>

                  <AppText variant="body" weight="medium" numberOfLines={2} style={{ flex: 1 }}>

                    {parentLabel}

                  </AppText>

                  <Icon name="expand-more" size={22} color={colors.subtle} />

                </ClayView>

              </PressClay>

            </>

          ) : null}



          {kind === 'room' ? (

            <>

              <AppFormField

                label="Capacity"

                value={capacity}

                onChangeText={setCapacity}

                keyboardType="number-pad"

                placeholder="30"

              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

                <AppText variant="body" style={{ color: colors.text }}>

                  Bookable

                </AppText>

                <Switch value={isBookable} onValueChange={setIsBookable} />

              </View>

            </>

          ) : null}



          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>

            <AppButton title="Cancel" variant="outline" onPress={onClose} disabled={busy} />

            <AppButton

              title={busy ? 'Creating…' : 'Create & use'}

              onPress={() =>

                onConfirm({

                  kind,

                  name: name.trim(),

                  colorHex: kind === 'eventType' ? normalizeEventTypeColor(colorHex) : undefined,

                  groupType: kind === 'group' ? groupType : undefined,

                  parentGroupId,

                  capacity: kind === 'room' ? Math.max(1, Number(capacity) || 1) : undefined,

                  isBookable: kind === 'room' ? isBookable : undefined,

                })

              }

              disabled={busy || !name.trim()}

            />

          </View>

        </ScrollView>

      </BottomSheet>



      <OptionPickerSheet

        isVisible={typePickerOpen}

        onClose={() => setTypePickerOpen(false)}

        title="Group type"

        options={typePickerOptions}

        selected={groupType}

        onSelect={(v) => {

          if (v) setGroupType(v);

        }}

        includeAllOption={false}

        height={importWizardSheetHeight(0.75, 520)}

        zIndexBase={250}

      />



      <SearchableOptionPickerSheet

        isVisible={parentPickerOpen}

        onClose={() => setParentPickerOpen(false)}

        title="Parent group"

        options={parentGroupOptions}

        selected={parentGroupId}

        onSelect={(id) => setParentGroupId(id)}

        allLabel="No parent"

        zIndexBase={260}

      />

    </>

  );

}


