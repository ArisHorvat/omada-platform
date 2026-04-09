import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { unwrap, usersApi } from '@/src/api';

export const useUsersListLogic = () => {
  const [search, setSearch] = useState('');

  const directoryQuery = useQuery({
    queryKey: ['users', 'directory', 'search', search],
    queryFn: async () =>
      await unwrap(usersApi.getDirectory(1, 50, search.trim() || null, null, null, null)),
  });

  const filteredUsers = (directoryQuery.data?.items ?? []).map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    role: u.roleName,
    email: u.email,
  }));

  return { search, setSearch, filteredUsers };
};