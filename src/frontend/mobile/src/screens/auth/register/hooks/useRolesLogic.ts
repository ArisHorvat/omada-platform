import { useState } from 'react';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';

export const useRolesLogic = () => {
  const { roles, setRoles, orgData } = useRegistration();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    setRoles([...roles, 'New Role']);
    setEditingIndex(roles.length);
    setEditName('New Role');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(roles[index]);
  };

  const handleSave = () => {
    if (editingIndex !== null && editName.trim()) {
      const newRoles = [...roles];
      newRoles[editingIndex] = editName.trim();
      setRoles(newRoles);
      setEditingIndex(null);
    }
  };

  const handleDelete = () => {
    if (editingIndex !== null) { setRoles(roles.filter((_, i) => i !== editingIndex)); setEditingIndex(null); }
  };

  return { roles, orgData, editingIndex, editName, setEditName, handleAdd, handleEdit, handleSave, handleDelete };
};