import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';

export interface Attachment { name: string; url: string; type: string; }
export interface NewsItem { id: string; title: string; content: string; type: 'announcement' | 'alert' | 'event' | 'info'; createdAt: string; attachments?: Attachment[]; coverImageUrl?: string; }
interface TempAttachment extends Attachment { isNew?: boolean; uri?: string; }

export const useNewsLogic = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'announcement' | 'alert' | 'event' | 'info'>('announcement');
  const [isPosting, setIsPosting] = useState(false);
  const [tempAttachments, setTempAttachments] = useState<TempAttachment[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<TempAttachment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) setOrgId(data.id);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (orgId) fetchNews();
  }, [orgId]);

  const fetchNews = async () => {
    try {
      const data = await CurrentOrganizationService.getWidgetData('news');
      setNews(data);
    } catch (error) { console.error("Failed to fetch news", error); } finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => { setRefreshing(true); fetchNews(); };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: true });
    if (!result.canceled) {
      const newAtts = result.assets.map(a => ({ name: a.name, type: a.mimeType || 'application/octet-stream', url: a.uri, uri: a.uri, isNew: true }));
      setTempAttachments([...tempAttachments, ...newAtts]);
    }
  };

  const handlePickImageAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
      if (!result.canceled) {
        const newAtts = result.assets.map(asset => ({ name: asset.fileName || `image_${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg', url: asset.uri, uri: asset.uri, isNew: true }));
        setTempAttachments(prev => [...prev, ...newAtts]);
      }
    } catch (e) { Alert.alert("Error", "Failed to pick images"); }
  };

  const handleAddAttachment = () => {
    Alert.alert('Add Attachment', 'Choose a source', [{ text: 'Photos', onPress: handlePickImageAttachment }, { text: 'Files', onPress: handlePickFile }, { text: 'Cancel', style: 'cancel' }]);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
      if (!result.canceled) {
        const asset = result.assets[0];
        setCoverPhoto({ name: asset.fileName || `cover_${Date.now()}.jpg`, type: 'image/jpeg', url: asset.uri, uri: asset.uri, isNew: true });
      }
    } catch (e) { Alert.alert("Error", "Failed to pick image"); }
  };

  const openCreateModal = () => {
    setEditingId(null); setNewTitle(''); setNewContent(''); setNewType('announcement'); setTempAttachments([]); setCoverPhoto(null); setModalVisible(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingId(item.id); setNewTitle(item.title); setNewContent(item.content); setNewType(item.type);
    let existing = item.attachments?.map(a => ({ ...a, isNew: false })) || [];
    if (item.coverImageUrl) {
        const cover = existing.find(a => a.url === item.coverImageUrl);
        if (cover) { setCoverPhoto(cover); existing = existing.filter(a => a.url !== item.coverImageUrl); } 
        else { setCoverPhoto({ name: 'Cover', url: item.coverImageUrl, type: 'image/jpeg', isNew: false }); }
    } else { setCoverPhoto(null); }
    setTempAttachments(existing); setModalVisible(true); setSelectedArticle(null);
  };

  const handleSavePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) { Alert.alert("Error", "Please fill in all fields."); return; }
    setIsPosting(true);
    try {
      let finalCoverUrl = coverPhoto?.url;
      let finalCoverAttachment: Attachment | null = null;
      if (coverPhoto) {
          if (coverPhoto.isNew && coverPhoto.uri) {
             finalCoverUrl = await CurrentOrganizationService.uploadFile({ uri: coverPhoto.uri, name: coverPhoto.name, type: coverPhoto.type });
          }
          finalCoverAttachment = { name: coverPhoto.name, url: finalCoverUrl!, type: coverPhoto.type };
      }
      const finalAttachments: Attachment[] = [];
      for (const att of tempAttachments) {
        if (att.isNew && att.uri) {
            const url = await CurrentOrganizationService.uploadFile({ uri: att.uri, name: att.name, type: att.type });
            finalAttachments.push({ name: att.name, url, type: att.type });
        } else { finalAttachments.push({ name: att.name, url: att.url, type: att.type }); }
      }
      const allAttachments = [...finalAttachments];
      if (finalCoverAttachment) allAttachments.unshift(finalCoverAttachment);

      const postData = { title: newTitle, content: newContent, type: newType, attachments: allAttachments, coverImageUrl: finalCoverUrl };
      if (editingId) await CurrentOrganizationService.updateWidgetData('news', editingId, postData);
      else await CurrentOrganizationService.createWidgetData('news', postData);
      setModalVisible(false); fetchNews(); 
    } catch (error) { Alert.alert("Error", "Network error."); } finally { setIsPosting(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Post", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
          try { await CurrentOrganizationService.deleteWidgetData('news', id); fetchNews(); } catch (e) { Alert.alert("Error", "Failed to delete post."); }
      }}]);
  };

  return { news, loading, refreshing, handleRefresh, modalVisible, setModalVisible, newTitle, setNewTitle, newContent, setNewContent, newType, setNewType, isPosting, tempAttachments, setTempAttachments, coverPhoto, setCoverPhoto, editingId, selectedArticle, setSelectedArticle, isPreviewing, setIsPreviewing, handleAddAttachment, handlePickImage, removeAttachment: (i: number) => setTempAttachments(tempAttachments.filter((_, idx) => idx !== i)), removeCoverPhoto: () => setCoverPhoto(null), openCreateModal, openEditModal, handleSavePost, handleDelete };
};