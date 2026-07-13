import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';



import { eventTypesApi, groupsApi, orgAdminApi, unwrap, usersApi } from '@/src/api';
import apiClient from '@/src/api/apiClient';
import type { IServiceResponseOfPagedResponseOfOrganizationMemberDto } from '@/src/api/generatedClient';

import { QUERY_KEYS } from '@/src/api/queryKeys';
import { scrapedHostAliasesApi } from '@/src/api/scrapedHostAliasesApi';

import type { EventTypeDto, GroupTreeNodeDto, GroupTypeOptionDto } from '@/src/api/generatedClient';

import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import { filterAssignableRoles } from '@/src/screens/admin/members-workspace/utils/memberRoles';

import { buildTypeLabelMap, canonicalGroupTypeKey, typeKeysMatchingFilter } from '@/src/screens/admin/groups-workspace/utils/groupTypeLabels';
import type { GroupTimetableKind } from '../import-wizard/importWizardTypes';

import type { TimetablesWorkspaceModel } from './useTimetablesWorkspace';

const STAFF_PAGE_SIZE = 100;

async function fetchOrgStaffForImportPicker() {
  const response = await apiClient.get<IServiceResponseOfPagedResponseOfOrganizationMemberDto>(
    '/Organizations/current/members',
    { params: { Page: 1, PageSize: STAFF_PAGE_SIZE, includeAdmins: true } },
  );
  return unwrap(Promise.resolve(response.data));
}



export const CREATE_MAPPING_OPTION = '__create_new__';
export const SAVED_PENDING_HOST_PREFIX = '__saved_pending__:';



export type MappingPickerOption = {

  value: string;

  label: string;

  subtitle?: string;

  suggested?: boolean;

  colorHex?: string;

};



function flattenTree(nodes: GroupTreeNodeDto[], depth = 0): { id: string; name: string; type: string; depth: number; memberCount: number }[] {

  const out: { id: string; name: string; type: string; depth: number; memberCount: number }[] = [];

  for (const node of nodes) {

    out.push({

      id: node.id,

      name: node.name,

      type: node.type,

      depth,

      memberCount: node.memberCount,

    });

    if (node.children?.length) out.push(...flattenTree(node.children, depth + 1));

  }

  return out;

}



export function mergeMappingPickerOptions(

  catalog: MappingPickerOption[],

  suggestions: { id?: string | null; label: string; subtitle?: string | null; score?: number }[],

  createLabel?: string,

): MappingPickerOption[] {

  const seen = new Set<string>();

  const out: MappingPickerOption[] = [];



  for (const s of suggestions) {

    if (!s.id || seen.has(s.id)) continue;

    seen.add(s.id);

    const catalogMatch = catalog.find((c) => c.value === s.id);

    out.push({

      value: s.id,

      label: s.label,

      subtitle: s.subtitle ? `${s.subtitle} · suggested` : 'Suggested match',

      suggested: true,

      colorHex: catalogMatch?.colorHex,

    });

  }



  for (const row of catalog) {

    if (seen.has(row.value)) continue;

    seen.add(row.value);

    out.push(row);

  }



  if (createLabel) {

    out.push({ value: CREATE_MAPPING_OPTION, label: createLabel, subtitle: 'Add to your organization' });

  }



  return out;

}



export function useImportScheduleMappingCatalogs(model: TimetablesWorkspaceModel) {

  const { organization } = useCurrentOrganization();

  const orgId = organization?.id ?? '';

  const membersQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, 'import-host-picker-all', 'includeAdmins'),
    queryFn: fetchOrgStaffForImportPicker,
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const directoryQuery = useQuery({
    queryKey: ['users', 'directory', orgId, 'import-teacher-picker'],
    queryFn: () => unwrap(usersApi.getDirectory(1, STAFF_PAGE_SIZE, null, null, null, null)),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const savedHostAliasesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.scrapedHostAliases(orgId),
    queryFn: () => scrapedHostAliasesApi.list(),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const eventTypesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId),
    queryFn: () => unwrap(eventTypesApi.getAll()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });



  const groupsTreeQuery = useQuery({

    queryKey: QUERY_KEYS.groups.tree(orgId),

    queryFn: () => unwrap(groupsApi.getTree()),

    enabled: !!orgId,

    staleTime: 1000 * 60 * 3,

  });



  const groupTypesQuery = useQuery({

    queryKey: QUERY_KEYS.groups.types(orgId),

    queryFn: () => unwrap(groupsApi.getTypes()),

    enabled: !!orgId,

    staleTime: 1000 * 60 * 5,

  });



  const rolesQuery = useQuery({

    queryKey: QUERY_KEYS.orgAdmin.roles(orgId),

    queryFn: () => unwrap(orgAdminApi.getRoles()),

    enabled: !!orgId,

    staleTime: 1000 * 60 * 5,

  });



  const eventTypes = (eventTypesQuery.data ?? []) as EventTypeDto[];



  const eventTypesById = useMemo(() => {

    const map = new Map<string, EventTypeDto>();

    for (const t of eventTypes) {

      if (t.id) map.set(t.id, t);

    }

    return map;

  }, [eventTypes]);



  const eventTypeOptions = useMemo<MappingPickerOption[]>(

    () =>

      eventTypes

        .filter((t) => t.id)

        .map((t) => ({

          value: t.id!,

          label: t.name?.trim() || 'Event type',

          colorHex: t.color,

        })),

    [eventTypes],

  );



  const hostMemberOptions = useMemo<MappingPickerOption[]>(() => {
    const seen = new Set<string>();
    const out: MappingPickerOption[] = [];

    const addMember = (userId: string, label: string, subtitle?: string) => {
      const id = userId.trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      out.push({ value: id, label, subtitle });
    };

    for (const u of directoryQuery.data?.items ?? []) {
      if (!u.id) continue;
      const label = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email?.trim() || 'Member';
      addMember(u.id, label, u.roleName ?? undefined);
    }

    for (const m of membersQuery.data?.items ?? []) {
      if (!m.userId) continue;
      const label = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email?.trim() || 'Member';
      addMember(m.userId, label, m.roleName ?? undefined);
    }

    for (const h of model.hostOptions) {
      if (!h.value) continue;
      addMember(h.value, h.label, h.subtitle);
    }

    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [directoryQuery.data?.items, membersQuery.data?.items, model.hostOptions]);

  const unmappedHostOptions = useMemo<MappingPickerOption[]>(() => {
    return (savedHostAliasesQuery.data ?? [])
      .filter((a) => a.scrapedLabel?.trim() && !a.hostUserId?.trim())
      .map((a) => ({
        value: `${SAVED_PENDING_HOST_PREFIX}${a.scrapedLabel}`,
        label: a.pendingDisplayName?.trim() || a.scrapedLabel,
        subtitle: a.pendingDisplayName
          ? `Saved pending · scraped as ${a.scrapedLabel}`
          : `Saved unmapped · ${a.scrapedLabel}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [savedHostAliasesQuery.data]);

  /** Resolve mapped host labels in mapping rows. */
  const hostLookupOptions = useMemo<MappingPickerOption[]>(() => {
    const seen = new Set<string>();
    const out: MappingPickerOption[] = [];

    for (const row of hostMemberOptions) {
      if (seen.has(row.value)) continue;
      seen.add(row.value);
      out.push(row);
    }

    for (const h of model.hostOptions) {
      if (!h.value || seen.has(h.value)) continue;
      seen.add(h.value);
      out.push({
        value: h.value,
        label: h.label,
        subtitle: h.subtitle,
      });
    }

    return out;
  }, [hostMemberOptions, model.hostOptions]);

  const hostOptions = hostMemberOptions;



  const roomOptions = useMemo<MappingPickerOption[]>(
    () =>
      model.roomOptions.map((r) => ({
        value: r.value,
        label: r.label,
        subtitle: r.subtitle,
      })),
    [model.roomOptions],
  );



  const offeringOptions = useMemo<MappingPickerOption[]>(

    () =>

      model.offeringOptions.map((o) => ({

        value: o.value,

        label: o.label,

        subtitle: o.subtitle,

      })),

    [model.offeringOptions],

  );



  const groupFlatRows = useMemo(
    () => flattenTree(groupsTreeQuery.data ?? []),
    [groupsTreeQuery.data],
  );

  const groupTypeCatalog = (groupTypesQuery.data ?? []) as GroupTypeOptionDto[];
  const typeLabelByKey = useMemo(() => buildTypeLabelMap(groupTypeCatalog), [groupTypeCatalog]);

  const groupOptions = useMemo<MappingPickerOption[]>(() => {
    return groupFlatRows
      .map((row) => ({
        value: row.id,
        label: row.name,
        subtitle: `${typeLabelByKey.get(row.type.toLowerCase()) ?? row.type} · ${row.memberCount} members`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [groupFlatRows, typeLabelByKey]);

  const filterGroupsByKind = useMemo(
    () => (groupKind: GroupTimetableKind | null) => {
      if (!groupKind) return groupOptions;
      const allowed = typeKeysMatchingFilter(groupKind);
      return groupOptions.filter((g) => {
        const row = groupFlatRows.find((r) => r.id === g.value);
        if (!row) return false;
        return allowed.has(canonicalGroupTypeKey(row.type));
      });
    },
    [groupOptions, groupFlatRows],
  );

  const parentGroupPickerOptions = useMemo(
    () =>
      groupFlatRows.map((row) => ({
        value: row.id,
        label: row.name,
        subtitle: `${' '.repeat(row.depth * 2)}${typeLabelByKey.get(row.type.toLowerCase()) ?? row.type} · ${row.memberCount} members`,
      })),
    [groupFlatRows, typeLabelByKey],
  );



  const inviteableRoles = useMemo(

    () => filterAssignableRoles(rolesQuery.data ?? []).map((r) => r.name ?? '').filter(Boolean),

    [rolesQuery.data],

  );



  const getEventType = (id: string | null | undefined) => (id ? eventTypesById.get(id) : undefined);



  return {

    eventTypeOptions,

    eventTypesById,

    getEventType,

    hostOptions,

    hostLookupOptions,

    unmappedHostOptions,

    roomOptions,

    offeringOptions,

    groupOptions,
    filterGroupsByKind,

    groupTypeCatalog,

    parentGroupPickerOptions,

    typeLabelByKey,

    inviteableRoles,

    eventTypesLoading: eventTypesQuery.isLoading,

    refetchEventTypes: eventTypesQuery.refetch,

    refetchGroups: groupsTreeQuery.refetch,

  };

}


