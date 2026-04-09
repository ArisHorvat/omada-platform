import { useState } from 'react';
import { Alert } from 'react-native';

import { useNewsApi } from './useNewsApi';
import {
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsItemDto,
  NewsType,
} from '@/src/api/generatedClient';

export const useNewsAdminLogic = () => {
  const api = useNewsApi();

  // Modal & Form State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<NewsType>(NewsType.Announcement);

  // Helper to completely clear the form
  const resetForm = () => {
    setEditingId(null);
    setNewTitle('');
    setNewContent('');
    setNewType(NewsType.Announcement);
    setCreateModalVisible(false);
  };

  // Triggered when an Admin clicks "Edit" on a news post
  const handleOpenEdit = (item: NewsItemDto) => {
    setEditingId(item.id);
    setNewTitle(item.title);
    setNewContent(item.content);
    setNewType(item.type);
    setCreateModalVisible(true);
  };

  // Triggered when the Admin clicks "Post" or "Save"
  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing Info', 'Title and content are required.');
      return;
    }

    try {
      if (editingId) {
        // UPDATE EXISTING POST
        const request = new UpdateNewsRequest({
          title: newTitle.trim(),
          content: newContent.trim(),
          type: newType,
          coverImageUrl: undefined, // Add image logic here later
        });

        await api.updateNews.mutateAsync({ id: editingId, request });
      } else {
        // CREATE NEW POST
        const request = new CreateNewsRequest({
          title: newTitle.trim(),
          content: newContent.trim(),
          type: newType,
          coverImageUrl: undefined,
        });

        await api.createNews.mutateAsync(request);
      }
      resetForm();
    } catch (error) {
      // The API hook already shows an Alert, so we just catch the promise rejection here
      console.log('Submission failed', error);
    }
  };

  // Triggered when the Admin clicks "Delete"
  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => api.deleteNews.mutate(id) },
      ]
    );
  };

  return {
    // Data
    items: api.items,
    loading: api.isLoading,
    refreshing: api.isFetching,
    onRefresh: api.refetch,

    // Form State
    createModalVisible,
    setCreateModalVisible,
    editingId,
    newTitle,
    setNewTitle,
    newContent,
    setNewContent,
    newType,
    setNewType,

    // Actions
    resetForm,
    handleOpenEdit,
    handlePost,
    handleDelete,
  };
};

