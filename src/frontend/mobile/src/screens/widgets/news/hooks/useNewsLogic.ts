import { useState } from 'react';
import { useNewsData } from './useNewsData';
import { useNewsForm } from './useNewsForm';
import { NewsItem } from '../types';

export const useNewsLogic = () => {
  // 1. Initialize Data Logic
  const data = useNewsData();

  // 2. Initialize Form Logic (Pass fetchNews so form can refresh list on success)
  const form = useNewsForm(data.fetchNews);

  // 3. View Logic (Specific to reading an article)
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  return {
    // Namespace 1: List Data
    data: {
      items: data.items,
      loading: data.loading,
      refreshing: data.refreshing,
      onRefresh: data.onRefresh,
      delete: data.handleDelete
    },

    // Namespace 2: Create/Edit Form
    form, 

    // Namespace 3: View Details
    view: {
      selected: selectedArticle,
      setSelected: setSelectedArticle,
      close: () => setSelectedArticle(null)
    }
  };
};