import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/src/context/AuthContext';
import { UserService } from '@/src/services/UserService';

export const useEditProfileLogic = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [newProfilePic, setNewProfilePic] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (token) {
          const user = await UserService.getMe();
          setPhone(user.phoneNumber || '');
          setAddress(user.address || '');
          setProfilePic(user.profilePictureUrl ?? null);
        }
      } catch (e) { Alert.alert('Error', 'Failed to load profile data.'); } finally { setIsLoading(false); }
    };
    loadProfile();
  }, [token]);

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled) setNewProfilePic(result.assets[0]);
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      let uploadedUrl = profilePic;
      if (newProfilePic) {
        uploadedUrl = await UserService.uploadFile({
          uri: newProfilePic.uri, name: newProfilePic.name || 'profile.jpg', type: newProfilePic.mimeType || 'image/jpeg',
        });
      }
      await UserService.updateProfile({ phoneNumber: phone, address: address, profilePictureUrl: uploadedUrl || undefined });
      Alert.alert('Success', 'Profile updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) { Alert.alert('Error', 'Failed to update profile.'); } finally { setIsSaving(false); }
  };

  return {
    phone, setPhone, address, setAddress, profilePic, newProfilePic, isLoading, isSaving, pickImage, handleSave
  };
};