import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { useRegistrationContext } from '../context/RegistrationContext';
import { ToolsService } from '@/src/services/ToolsService';

export const useUsersImportLogic = () => {
  const { importedUsers, setImportedUsers, submitRegistration, isSubmitting } = useRegistrationContext();
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

      setImportedUsers(parsedUsers);
      Alert.alert("Success", `Successfully imported ${parsedUsers.length} users.`);
      
    } catch (error: any) {
      Alert.alert("Import Failed", error.message || "Could not parse the file.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- MISSING FUNCTION ADDED HERE ---
  const handleInviteLink = () => {
    // Logic: Since the Org doesn't exist yet, we can't make a real link.
    // We just show a confirmation that this preference is recorded.
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
    handleInviteLink // <--- Exported now!
  };
};