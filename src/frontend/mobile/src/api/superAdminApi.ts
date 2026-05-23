import apiClient from '@/src/api/apiClient';

type ServiceResponse<T> = {
  isSuccess?: boolean;
  data?: T;
  error?: { code?: string; message?: string; detail?: string };
};

export function fetchSuperAdminOrganizations(page = 1, pageSize = 20) {
  return apiClient
    .get<ServiceResponse<{ items?: unknown[]; totalCount?: number; page?: number; pageSize?: number }>>(
      'super-admin/organizations',
      { params: { Page: page, PageSize: pageSize }, headers: { Accept: 'application/json' } },
    )
    .then((r) => r.data);
}

export function deleteSuperAdminOrganization(id: string) {
  return apiClient
    .delete<ServiceResponse<boolean>>(`super-admin/organizations/${id}`, {
      headers: { Accept: 'application/json' },
    })
    .then((r) => r.data);
}
