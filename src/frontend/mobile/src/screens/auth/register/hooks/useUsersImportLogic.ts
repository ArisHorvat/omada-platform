import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { useRegistrationContext } from '../context/RegistrationContext';
import { ToolsService } from '@/src/services/ToolsService';

export const useUsersImportLogic = () => {
  // 1. Pull roles and defaultUserPassword from context
  const { importedUsers, setImportedUsers, submitRegistration, isSubmitting, roles, defaultUserPassword } = useRegistrationContext();
  const [activeTab, setActiveTab] = useState<'email' | 'upload'>('email');
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      await handleFileUpload(file);
    } catch (err) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleFileUpload = async (file: DocumentPicker.DocumentPickerAsset) => {
    setIsLoading(true);
    try {
      const parsedUsers = await ToolsService.parseUsers(
        file.uri, 
        file.name, 
        file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      // Safety check to ensure we got an array back
      if (Array.isArray(parsedUsers)) {
          setImportedUsers(parsedUsers);
          Alert.alert("Success", `Successfully imported ${parsedUsers.length} users.`);
      } else {
          throw new Error("Invalid response format from server.");
      }
    } catch (error: any) {
      Alert.alert("Import Failed", error.message || "Could not parse the file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteLink = () => {
    Alert.alert(
      "Link Option Selected", 
      "A magic invite link will be generated and sent to your email once you finish setting up the organization."
    );
  };

  return {
    importedUsers,
    submitRegistration,
    isSubmitting,
    activeTab,
    setActiveTab,
    pickDocument,
    isLoading,
    handleInviteLink,
    roles,               // Export for UI
    defaultUserPassword  // Export for UI
  };
};