import apiClient from '@/src/api/apiClient';
import { unwrap, usersApi } from '@/src/api';
import type { PagedResponseOfUserDirectoryItemDto, UserDirectoryItemDto } from '@/src/api/generatedClient';

export type DirectoryGroupOptionDto = {
  id: string;
  name: string;
  type?: string | null;
  depth: number;
  memberCount: number;
};

function readEnvelopeData<T>(body: unknown): T {
  if (body == null || typeof body !== 'object') {
    throw new Error('Invalid response.');
  }
  const env = body as Record<string, unknown>;
  const isSuccess = env.isSuccess ?? env.IsSuccess;
  if (isSuccess === false) {
    const errNode = (env.error ?? env.Error) as { message?: string; Message?: string } | undefined;
    throw new Error(errNode?.message ?? errNode?.Message ?? 'Request failed.');
  }
  const data = env.data ?? env.Data;
  if (data === undefined) {
    throw new Error('Response contained no data.');
  }
  return data as T;
}

function readStringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function mapGroupRow(row: Record<string, unknown>): DirectoryGroupOptionDto | null {
  const id = readStringField(row, 'id', 'Id');
  const name = readStringField(row, 'name', 'Name');
  if (!id || !name) return null;
  const typeRaw = row.type ?? row.Type;
  return {
    id,
    name,
    type: typeRaw != null ? String(typeRaw) : null,
    depth: Number(row.depth ?? row.Depth ?? 0),
    memberCount: Number(row.memberCount ?? row.MemberCount ?? 0),
  };
}

async function fetchGroupOptions(): Promise<DirectoryGroupOptionDto[]> {
  const paths = ['/Users/directory/groups', '/Groups/directory-filter'];
  let lastError: unknown;
  for (const path of paths) {
    try {
      const res = await apiClient.get(path);
      const rows = readEnvelopeData<Array<Record<string, unknown>>>(res.data);
      return rows.map(mapGroupRow).filter((g): g is DirectoryGroupOptionDto => g != null);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Could not load groups.');
}

async function fetchRoleOptions(): Promise<string[]> {
  try {
    const res = await apiClient.get('/Users/directory/roles');
    const rows = readEnvelopeData<string[]>(res.data);
    return rows.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim());
  } catch {
    const page = await usersDirectoryApi.getDirectory({ page: 1, pageSize: 100 });
    const names = new Set<string>();
    for (const item of page.items ?? []) {
      if (item.roleName?.trim()) names.add(item.roleName.trim());
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }
}

/** Directory helpers until NSwag includes extended Users directory routes. */
export const usersDirectoryApi = {
  async getDirectory(params: {
    page: number;
    pageSize: number;
    q?: string | null;
    role?: string | null;
    managerId?: string | null;
    departmentId?: string | null;
    groupId?: string | null;
  }): Promise<PagedResponseOfUserDirectoryItemDto> {
    try {
      const res = await apiClient.get('/Users/directory', {
        params: {
          Page: params.page,
          PageSize: params.pageSize,
          q: params.q || undefined,
          role: params.role || undefined,
          managerId: params.managerId || undefined,
          departmentId: params.departmentId || undefined,
          groupId: params.groupId || undefined,
        },
      });
      return readEnvelopeData<PagedResponseOfUserDirectoryItemDto>(res.data);
    } catch {
      const res = await usersApi.getDirectory(
        params.page,
        params.pageSize,
        params.q ?? null,
        params.role ?? null,
        params.managerId ?? null,
        params.departmentId ?? null,
      );
      return unwrap(res);
    }
  },

  getGroupOptions: fetchGroupOptions,

  getRoleOptions: fetchRoleOptions,
};

export type { UserDirectoryItemDto };
