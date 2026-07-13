import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { offeringPackagesApi } from '@/src/api/offeringPackagesApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { AppButton, AppFormField, AppText } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { ImportWizardSelectField } from '../import-wizard/ImportWizardSelectField';
import { importWizardSheetHeight } from '../import-wizard/importWizardSheetLayout';
import type { CreateImportOfferingInput } from '../import-wizard/importOfferingViaPackage';

type ProgramOption = { value: string; label: string; subtitle?: string };
type PackageOption = { value: string; label: string; subtitle?: string };

type Props = {
  visible: boolean;
  defaultName: string;
  periodId: string | null;
  programOptions: ProgramOption[];
  onClose: () => void;
  busy?: boolean;
  onConfirm: (payload: CreateImportOfferingInput) => void;
};

export function ImportScheduleCreateOfferingSheet({
  visible,
  defaultName,
  periodId,
  programOptions,
  onClose,
  busy = false,
  onConfirm,
}: Props) {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [courseName, setCourseName] = useState(defaultName);
  const [programGroupId, setProgramGroupId] = useState<string | null>(null);
  const [packageMode, setPackageMode] = useState<'existing' | 'new'>('new');
  const [packageId, setPackageId] = useState<string | null>(null);
  const [newPackageName, setNewPackageName] = useState('');
  const [applyToPeriod, setApplyToPeriod] = useState(true);
  const [programOpen, setProgramOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [packageModeOpen, setPackageModeOpen] = useState(false);

  const packagesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId),
    queryFn: () => offeringPackagesApi.list(),
    enabled: !!orgId && visible,
    staleTime: 30_000,
  });

  const packageOptions = useMemo((): PackageOption[] => {
    return (packagesQuery.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      subtitle: p.programGroupNames?.length
        ? `${p.items.length} course(s) · ${p.programGroupNames.join(', ')}`
        : `${p.items.length} course(s)`,
    }));
  }, [packagesQuery.data]);

  useEffect(() => {
    if (!visible) return;
    setCourseName(defaultName);
    setProgramGroupId(null);
    setApplyToPeriod(true);
  }, [visible, defaultName]);

  useEffect(() => {
    if (!visible) return;
    const pkgs = packagesQuery.data ?? [];
    setPackageMode(pkgs.length > 0 ? 'existing' : 'new');
    setPackageId(pkgs[0]?.id ?? null);
    setNewPackageName(defaultName ? `${defaultName} (import)` : 'Imported courses');
  }, [visible, defaultName, packagesQuery.dataUpdatedAt]);

  const programLabel =
    programOptions.find((p) => p.value === programGroupId)?.label ?? null;
  const packageLabel =
    packageOptions.find((p) => p.value === packageId)?.label ?? null;

  const packageModeLabel = packageMode === 'new' ? 'Create new package' : 'Existing package';

  const needsProgram = packageMode === 'new';

  const canSubmit =
    !!courseName.trim() &&
    !!periodId &&
    (needsProgram ? !!programGroupId : true) &&
    (packageMode === 'new' ? !!newPackageName.trim() : !!packageId);

  return (
    <>
      <BottomSheet
        isVisible={visible}
        onClose={onClose}
        height={importWizardSheetHeight(0.92)}
        contentPadding={0}
        zIndexBase={240}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        >
          <AppText variant="h3" weight="bold">
            Add course via curriculum package
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
            Term offerings are created from curriculum packages. Add this course to an existing package or
            create a new one linked to a program, then apply it to the current reporting period.
          </AppText>

          <AppFormField label="Course name" value={courseName} onChangeText={setCourseName} autoCapitalize="words" />

          <ImportWizardSelectField
            label="Package source"
            value={packageModeLabel}
            placeholder="How to add this course…"
            hint="Use an existing curriculum package or start a new one."
            colors={colors}
            onPress={() => setPackageModeOpen(true)}
          />

          {packageMode === 'new' ? (
            <>
              <ImportWizardSelectField
                label="Program"
                value={programLabel}
                placeholder="Select program…"
                hint="Required for a new package — same program group used in Offerings workspace."
                colors={colors}
                onPress={() => setProgramOpen(true)}
              />
              <AppFormField
                label="New package name"
                value={newPackageName}
                onChangeText={setNewPackageName}
                autoCapitalize="words"
              />
            </>
          ) : (
            <ImportWizardSelectField
              label="Curriculum package"
              value={packageLabel}
              placeholder="Select package…"
              hint="Uses the programs already linked to this package."
              colors={colors}
              onPress={() => setPackageOpen(true)}
            />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText variant="body" style={{ color: colors.text }}>
                Apply to current period now
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 16, marginTop: 4 }}>
                Creates the term offering immediately so you can map and import sessions.
              </AppText>
            </View>
            <Switch value={applyToPeriod} onValueChange={setApplyToPeriod} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <AppButton title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
            <AppButton
              title={busy ? 'Saving…' : 'Add & map'}
              onPress={() => {
                if (!periodId) return;
                if (packageMode === 'new' && !programGroupId) return;
                onConfirm({
                  periodId,
                  courseName: courseName.trim(),
                  programGroupId: packageMode === 'new' ? programGroupId : null,
                  packageMode,
                  packageId,
                  newPackageName: newPackageName.trim(),
                  applyToPeriod,
                });
              }}
              disabled={busy || !canSubmit}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      <OptionPickerSheet
        isVisible={programOpen}
        onClose={() => setProgramOpen(false)}
        title="Program"
        options={programOptions}
        selected={programGroupId}
        onSelect={(id) => {
          if (id) setProgramGroupId(id);
          setProgramOpen(false);
        }}
        includeAllOption={false}
        height={importWizardSheetHeight(0.75, 520)}
        zIndexBase={250}
      />

      <OptionPickerSheet
        isVisible={packageModeOpen}
        onClose={() => setPackageModeOpen(false)}
        title="Package source"
        options={[
          { value: 'existing', label: 'Existing package', subtitle: 'Add course to a package you already use' },
          { value: 'new', label: 'Create new package', subtitle: 'Start a fresh curriculum package' },
        ]}
        selected={packageMode}
        onSelect={(mode) => {
          if (mode === 'existing' || mode === 'new') setPackageMode(mode);
          setPackageModeOpen(false);
        }}
        includeAllOption={false}
        height={importWizardSheetHeight(0.55, 360)}
        zIndexBase={250}
      />

      <OptionPickerSheet
        isVisible={packageOpen}
        onClose={() => setPackageOpen(false)}
        title="Curriculum package"
        options={packageOptions}
        selected={packageId}
        onSelect={(id) => {
          if (id) setPackageId(id);
          setPackageOpen(false);
        }}
        includeAllOption={false}
        height={importWizardSheetHeight(0.75, 520)}
        zIndexBase={250}
      />
    </>
  );
}
