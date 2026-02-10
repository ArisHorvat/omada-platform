import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import apiClient from '@/src/services/apiClient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { NewsItem, Attachment, NewsType } from '../types';

export const useNewsForm = (onSuccess: () => void) => {
  const { activeSession } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NewsType>('announcement');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<Attachment | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setType('announcement');
    setAttachments([]);
    setCoverPhoto(null);
  };

  const openCreate = () => {
    resetForm();
    setVisible(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setType(item.type);
    // Assuming item has attachments/cover props mapped correctly
    setAttachments(item.attachments || []); 
    setCoverPhoto(item.coverImageUrl ? { url: item.coverImageUrl, type: 'image' } as Attachment : null);
    setVisible(true);
  };

  // 2. Picker Logic
  const handlePickImage = async (isCover = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: isCover, // Cover photos usually need cropping
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const newAtt: Attachment = {
        name: asset.fileName || 'image.jpg',
        uri: asset.uri, // Local URI for upload
        url: asset.uri, // For preview
        type: 'image/jpeg'
      };

      if (isCover) setCoverPhoto(newAtt);
      else setAttachments(prev => [...prev, newAtt]);
    }
  };

  const handleAddAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachments(prev => [...prev, {
        name: asset.name,
        uri: asset.uri,
        url: asset.uri,
        type: asset.mimeType || 'application/octet-stream'
      }]);
    }
  };

  // 3. Submission Logic
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return Alert.alert('Error', 'Title and Content are required');
    if (!activeSession?.orgId) return Alert.alert('Error', 'No active organization session');

    setIsPosting(true);
    try {
      const payload = {
        title,
        content,
        type,
        attachments, 
        coverImageUrl: coverPhoto?.url || coverPhoto?.uri
      };

      const baseUrl = `/organizations/${activeSession.orgId}/widgets/news/data`;

      if (editingId) {
        await apiClient.put(`${baseUrl}/${editingId}`, payload);
      } else {
        await apiClient.post(baseUrl, payload);
      }

      setVisible(false);
      resetForm();
      onSuccess(); 
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save post.");
    } finally {
      setIsPosting(false);
    }
  };

  return {
    visible, setVisible,
    isPosting,
    editingId,
    // Form Values
    values: { title, setTitle, content, setContent, type, setType, attachments, coverPhoto },
    // Actions
    actions: {
      openCreate,
      openEdit,
      submit: handleSubmit,
      pickImage: handlePickImage,
      addAttachment: handleAddAttachment,
      removeAttachment: (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
      },
      removeCover: () => setCoverPhoto(null)
    }
  };
};