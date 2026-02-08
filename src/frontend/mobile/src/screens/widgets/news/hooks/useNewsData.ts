import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { NewsItem } from '../types';

export const useNewsData = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = useCallback(async () => {
    try {
      const data = await CurrentOrganizationService.getWidgetData('news');
      setItems(data || []); 
    } catch (e) {
      console.error("Failed to fetch news", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
          try { 
            await CurrentOrganizationService.deleteWidgetData('news', id); 
            fetchNews(); // Refresh list after delete
          } catch (e) { 
            Alert.alert("Error", "Failed to delete post."); 
          }
        }
      }
    ]);
  };

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { items, loading, refreshing, onRefresh, fetchNews, handleDelete };
};