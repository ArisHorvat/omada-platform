import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/src/context/AuthContext';
import { UserService } from '@/src/services/UserService';
import apiClient from '@/src/services/apiClient';

export const useEditProfileLogic = () => {
  const router = useRouter();
  const { activeSession } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [newProfilePic, setNewProfilePic] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (activeSession) {
          const user = await UserService.getMe();
          setPhone(user.phoneNumber || '');
          setAddress(user.address || '');
          setProfilePic(user.profilePictureUrl ?? null);
        }
      } catch (e) { 
          Alert.alert('Error', 'Failed to load profile data.'); 
      } finally { 
          setIsLoading(false); 
      }
    };
    loadProfile();
  }, [activeSession]);

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled) setNewProfilePic(result.assets[0]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let uploadedUrl = profilePic;

      // 1. Upload new image if selected
      if (newProfilePic) {
        const formData = new FormData();
        // @ts-ignore: React Native FormData
        formData.append('file', {
            uri: newProfilePic.uri,
            name: newProfilePic.name || 'profile.jpg',
            type: newProfilePic.mimeType || 'image/jpeg',
        });

        // Use a generic file upload endpoint
        const response = await apiClient.post<{ url: string }>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrl = response.data.url;
      }

      // 2. Update Profile Data
      await UserService.updateProfile({ 
          phoneNumber: phone, 
          address: address, 
          profilePictureUrl: uploadedUrl || undefined 
      });

      Alert.alert('Success', 'Profile updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { 
        Alert.alert('Error', e.message || 'Failed to update profile.'); 
    } finally { 
        setIsSaving(false); 
    }
  };

  return { 
      phone, setPhone, 
      address, setAddress, 
      profilePic, newProfilePic, 
      pickImage, handleSave, 
      isLoading, isSaving 
  };
};