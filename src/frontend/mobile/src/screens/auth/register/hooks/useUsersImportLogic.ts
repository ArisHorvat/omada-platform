import { useState } from 'react';
import { Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';
import { ToolsService } from '@/src/services/ToolsService';

export const useUsersImportLogic = () => {
  const { importedUsers, setImportedUsers, submitRegistration, isSubmitting, defaultUserPassword, setDefaultUserPassword } = useRegistration();
  const [activeTab, setActiveTab] = useState<'upload' | 'email'>('email');
  const [isLoading, setIsLoading] = useState(false);

  const handleInviteLink = async () => {
    try {
        const link = 'https://omada.app/join/xyz123';
        await Share.share({ message: `Join our organization on Omada: ${link}` });
    } catch (error) { Alert.alert('Error', 'Could not share link.'); }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] });
    if (!result.canceled) {
        setIsLoading(true);
        const asset = result.assets[0];
        try {
            const users = await ToolsService.parseUsers({
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'text/csv'
            });
            setImportedUsers(users);
        } 
        catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to parse file.'); 
        }
        finally { 
          setIsLoading(false); 
        }
    }
  };

  return {
    importedUsers, submitRegistration, isSubmitting, defaultUserPassword, setDefaultUserPassword,
    activeTab, setActiveTab, isLoading, handleInviteLink, pickDocument
  };
};