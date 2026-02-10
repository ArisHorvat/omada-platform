import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import apiClient from '@/src/services/apiClient';
import { NewsItem } from '../types';

export const useNewsData = () => {
  const { activeSession } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = useCallback(async () => {
    if (!activeSession?.orgId) return;

    try {
      // NEW: Direct API Call
      // GET /api/organizations/{orgId}/widgets/news/data
      const result = await apiClient.get<NewsItem[]>(
        `/organizations/${activeSession.orgId}/widgets/news/data`
      );
      setItems(result.data || []); 
    } catch (e) {
      console.error("Failed to fetch news", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSession?.orgId]);

  // Initial Fetch
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Post", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          if (!activeSession?.orgId) return;
          try { 
            await apiClient.delete(
                `/organizations/${activeSession.orgId}/widgets/news/data/${id}`
            );
            fetchNews(); 
          } catch (e) { 
            Alert.alert("Error", "Failed to delete post"); 
          }
        } 
      }
    ]);
  };

  return { items, loading, refreshing, onRefresh, handleDelete };
};