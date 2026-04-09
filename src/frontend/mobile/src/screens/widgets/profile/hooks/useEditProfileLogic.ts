import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { unwrap, usersApi } from '@/src/api';
import { uploadPublicFile } from '@/src/api/uploadFile';
import { UpdateMyProfileRequest } from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';

export const useEditProfileLogic = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSession } = useAuth();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [pendingAvatarMime, setPendingAvatarMime] = useState<string | null>(null);
  const [pendingAvatarName, setPendingAvatarName] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => await unwrap(usersApi.getMe()),
    enabled: !!activeSession,
  });

  useEffect(() => {
    if (!user) return;
    setPhone(user.phoneNumber ?? user.phone ?? '');
    setAddress(user.address ?? '');
    setBio(user.bio ?? '');
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (req: UpdateMyProfileRequest) => await unwrap(usersApi.updateMe(req)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile });
      setPendingAvatarUri(null);
      setPendingAvatarMime(null);
      setPendingAvatarName(null);
      Alert.alert('Success', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (e: unknown) =>
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update profile.'),
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo library access to choose a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPendingAvatarUri(asset.uri);
    setPendingAvatarMime(asset.mimeType || 'image/jpeg');
    setPendingAvatarName(asset.fileName || 'avatar.jpg');
  };

  const handleSave = async () => {
    let avatarUrl: string | undefined;
    if (pendingAvatarUri && pendingAvatarMime && pendingAvatarName) {
      try {
        avatarUrl = await uploadPublicFile(pendingAvatarUri, pendingAvatarMime, pendingAvatarName);
      } catch (e: unknown) {
        Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload photo.');
        return;
      }
    }

    const req = new UpdateMyProfileRequest();
    req.phoneNumber = phone.trim();
    req.address = address.trim();
    req.bio = bio.trim();
    if (avatarUrl !== undefined) req.avatarUrl = avatarUrl;
    updateMutation.mutate(req);
  };

  const displayAvatarUri = pendingAvatarUri || resolveMediaUrl(user?.avatarUrl);

  return {
    user,
    phone,
    setPhone,
    address,
    setAddress,
    bio,
    setBio,
    displayAvatarUri,
    pickImage,
    handleSave,
    isLoading,
    isSaving: updateMutation.isPending,
  };
};
