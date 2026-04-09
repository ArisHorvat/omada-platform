import { useState } from 'react';
import { Alert } from 'react-native';
import { useRegistrationContext } from '@/src/screens/auth/register/context/RegistrationContext';

export const useRolesLogic = () => {
  const { roles, setRoles, orgData } = useRegistrationContext();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Helper to validate name uniqueness
  const isNameDuplicate = (name: string, excludeIndex: number | null = null) => {
    return roles.some((role, index) => 
      index !== excludeIndex && 
      role.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  const handleAdd = () => {
    // Prevent adding if "New Role" already exists to avoid confusion
    if (isNameDuplicate('New Role')) {
      Alert.alert('Action Required', 'Please rename the existing "New Role" before adding another.');
      return;
    }

    setRoles([...roles, 'New Role']);
    // Automatically enter edit mode for the new role
    setEditingIndex(roles.length); 
    setEditName('New Role');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(roles[index]);
  };

  const handleSave = () => {
    const trimmedName = editName.trim();

    // 1. Check Empty
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Role name cannot be empty.');
      return;
    }

    // 2. Check Duplicates
    if (isNameDuplicate(trimmedName, editingIndex)) {
      Alert.alert('Duplicate Role', `The role "${trimmedName}" already exists. Please choose a different name.`);
      return;
    }

    // 3. Save
    if (editingIndex !== null) {
      const newRoles = [...roles];
      newRoles[editingIndex] = trimmedName;
      setRoles(newRoles);
      setEditingIndex(null);
    }
  };

  const handleDelete = () => {
    if (editingIndex !== null) { 
        setRoles(roles.filter((_, i) => i !== editingIndex)); 
        setEditingIndex(null); 
    }
  };

  return { 
    roles, 
    orgData, 
    editingIndex, 
    editName, 
    setEditName, 
    handleAdd, 
    handleEdit, 
    handleSave, 
    handleDelete 
  };
};