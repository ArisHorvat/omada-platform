import { useState } from 'react';

const USERS = [
  { id: '1', name: 'Alice Johnson', role: 'Student', email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', role: 'Teacher', email: 'bob@example.com' },
  { id: '3', name: 'Charlie Brown', role: 'Student', email: 'charlie@example.com' },
  { id: '4', name: 'Dr. Emily Davis', role: 'Admin', email: 'emily@example.com' },
];

export const useUsersListLogic = () => {
  const [search, setSearch] = useState('');
  const filteredUsers = USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  return { search, setSearch, filteredUsers };
};