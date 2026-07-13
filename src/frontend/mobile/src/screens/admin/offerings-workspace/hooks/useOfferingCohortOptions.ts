import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';
import { groupsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type { GroupTreeNodeDto } from '@/src/api/generatedClient';

const PLACEMENT_TYPES = new Set(['series', 'group', 'subgroup', 'cohort', 'class']);

interface ServiceEnvelope<T> {
  data?: T;
  isSuccess?: boolean;
  error?: { message?: string };
}

export interface OfferingEnrollmentRow {
  id: string;
  cohortGroupId?: string;
  cohortGroupName?: string;
}

function findProgramNodes(nodes: GroupTreeNodeDto[], programIds: string[]): GroupTreeNodeDto[] {
  if (!programIds.length) return nodes;
  const wanted = new Set(programIds);
  const found: GroupTreeNodeDto[] = [];

  const walk = (list: GroupTreeNodeDto[]) => {
    for (const n of list) {
      if (wanted.has(n.id)) found.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return found;
}

function collectPlacementNodes(
  node: GroupTreeNodeDto,
  depth: number,
  out: Map<string, { label: string; subtitle: string; type: string }>,
) {
  const type = (node.type ?? 'group').toLowerCase();
  if (PLACEMENT_TYPES.has(type)) {
    const typeLabel = type === 'subgroup' ? 'Subgroup' : type === 'series' ? 'Series' : 'Group';
    out.set(node.id, {
      label: node.name,
      subtitle: `${' '.repeat(depth * 2)}${typeLabel}`,
      type,
    });
  }
  for (const child of node.children ?? []) {
    collectPlacementNodes(child, depth + 1, out);
  }
}

/** Cohort / subgroup options for weekly session audience. */
export function useOfferingCohortOptions(
  periodId: string,
  offeringId: string,
  programGroupIds: string[] = [],
) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const treeQuery = useQuery({
    queryKey: QUERY_KEYS.groups.tree(orgId),
    queryFn: () => unwrap(groupsApi.getTree()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['orgAdmin', orgId, 'offeringEnrollments', periodId, offeringId],
    queryFn: () =>
      unwrapOfferingsAxios(
        apiClient.get<ServiceEnvelope<OfferingEnrollmentRow[]>>(
          `/Organizations/current/periods/${periodId}/offerings/${offeringId}/enrollments`,
        ),
      ),
    enabled: !!orgId && !!periodId && !!offeringId,
    staleTime: 1000 * 60,
  });

  const enrolledCohortIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of enrollmentsQuery.data ?? []) {
      if (row.cohortGroupId) ids.add(row.cohortGroupId);
    }
    return ids;
  }, [enrollmentsQuery.data]);

  const options = useMemo(() => {
    const map = new Map<string, { value: string; label: string; subtitle?: string; type: string }>();
    const tree = treeQuery.data ?? [];
    const roots = findProgramNodes(tree, programGroupIds.filter(Boolean));
    const scope = roots.length ? roots : tree;

    for (const root of scope) {
      const bucket = new Map<string, { label: string; subtitle: string; type: string }>();
      collectPlacementNodes(root, 0, bucket);
      for (const [id, meta] of bucket) {
        map.set(id, {
          value: id,
          label: meta.label,
          type: meta.type,
          subtitle: `${meta.subtitle}${enrolledCohortIds.has(id) ? ' · enrolled' : ''}`,
        });
      }
    }

    for (const row of enrollmentsQuery.data ?? []) {
      if (!row.cohortGroupId || map.has(row.cohortGroupId)) continue;
      map.set(row.cohortGroupId, {
        value: row.cohortGroupId,
        label: row.cohortGroupName ?? 'Enrolled group',
        type: 'group',
        subtitle: 'From enrollments',
      });
    }

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [treeQuery.data, programGroupIds, enrollmentsQuery.data, enrolledCohortIds]);

  return {
    options,
    loading: treeQuery.isLoading || enrollmentsQuery.isLoading,
    hasEnrollments: (enrollmentsQuery.data?.length ?? 0) > 0,
  };
}
