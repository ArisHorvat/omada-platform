import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { API_BASE_URL } from '../config/config';

// 1. Define the "Figma-like" Component Schema
export type ComponentType = 'container' | 'text' | 'button' | 'image' | 'list' | 'carousel' | 'card' | 'row' | 'input';

export interface ComponentConfig {
  type: ComponentType;
  // Properties like text, color, action, source
  props?: Record<string, any>; 
  // Nested components (for containers, rows, cards)
  children?: ComponentConfig[];
  // For lists/carousels: The template to render for each item in the data
  itemTemplate?: ComponentConfig;
  // Data Binding: e.g., "title" maps to data["title"]
  dataKey?: string;
}

export interface WidgetSchema {
  id: string;
  title: string;
  description?: string;
  endpoint?: string;
  // The root layout of the widget
  layout: ComponentConfig;
  // Definitions for modals triggered by buttons
  modals?: Record<string, ComponentConfig>;
}

interface UniversalWidgetProps {
  schema: WidgetSchema;
  data?: Record<string, any>[];
}

// 2. The Universal Renderer
export function DynamicListWidget({ schema, data: initialData = [] }: UniversalWidgetProps) {
  const colors = useThemeColors();
  const { token } = useAuth();
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for Modals and Forms
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch data from the database if an endpoint is provided
  useEffect(() => {
    if (schema.endpoint && token) {
      fetchData();
    }
  }, [schema.endpoint, token]);

  const fetchData = async (refresh = false) => {
    if (!refresh) setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${schema.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch widget data", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(true);
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setActiveModal('edit_modal'); // Assumes schema has a modal named 'edit_modal'
  };

  const handleCreate = () => {
    setFormData({});
    setEditingId(null);
    setActiveModal('create_modal'); // Assumes schema has a modal named 'create_modal'
  };

  const handleSave = async () => {
    if (schema.endpoint && token) {
      // Real Database Save
      try {
        const url = editingId 
          ? `${API_BASE_URL}${schema.endpoint}/${editingId}` // PUT /api/.../{id}
          : `${API_BASE_URL}${schema.endpoint}`;             // POST /api/...
        
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          fetchData(true); // Refresh list from server to get clean state
          setFormData({});
          setActiveModal(null);
          Alert.alert("Success", editingId ? "Item updated." : "Item added.");
        } else {
          Alert.alert("Error", "Failed to save item.");
        }
      } catch (e) {
        Alert.alert("Error", "Network error occurred.");
      }
    } else {
      // Local Demo Fallback (if no endpoint defined)
      if (editingId) {
        setData(data.map(item => item.id === editingId ? { ...formData, id: editingId } : item));
      } else {
        const newItem = { ...formData, id: Date.now().toString() };
        setData([newItem, ...data]);
      }
      setFormData({});
      setActiveModal(null);
      Alert.alert("Success", "Saved locally (No endpoint defined)");
    }
  };

  // --- The Core Rendering Engine ---
  const renderComponent = (config: ComponentConfig, contextData?: any, index?: number): React.ReactNode => {
    const key = index !== undefined ? index : 'root';
    
    // Helper to resolve data binding (e.g., "$title" -> "Meeting at 5")
    const resolve = (val: any) => {
      if (typeof val === 'string' && val.startsWith('$') && contextData) {
        return contextData[val.substring(1)] || '';
      }
      return val;
    };

    switch (config.type) {
      case 'container':
        return (
          <View key={key} style={[styles.container, config.props?.style]}>
            {config.children?.map((child, i) => renderComponent(child, contextData, i))}
          </View>
        );

      case 'row':
        return (
          <View key={key} style={[styles.row, config.props?.style]}>
            {config.children?.map((child, i) => renderComponent(child, contextData, i))}
          </View>
        );

      case 'text':
        return (
          <Text key={key} style={[styles.text, { color: colors.text }, config.props?.style]}>
            {resolve(config.props?.text)}
          </Text>
        );

      case 'image':
        return (
          <Image
            key={key}
            source={{ uri: resolve(config.props?.source) }}
            style={[styles.image, config.props?.style]}
            resizeMode="cover"
          />
        );

      case 'button':
        const handlePress = () => {
          const action = config.props?.action;
          if (action === 'open_modal') setActiveModal(config.props?.target);
          if (action === 'save') handleSave();
          if (action === 'create') handleCreate();
        };
        return (
          <TouchableOpacity 
            key={key} 
            style={[styles.button, { backgroundColor: colors.primary }, config.props?.style]} 
            onPress={handlePress}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{config.props?.label || 'Button'}</Text>
          </TouchableOpacity>
        );

      case 'list':
        // Renders the fetched 'data' using the itemTemplate
        return (
            <View key={key} style={{ flex: 1 }}>
                {data.map((item, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => handleEdit(item)}
                      activeOpacity={0.9}
                    >
                       {config.itemTemplate && renderComponent(config.itemTemplate, item, i)}
                    </TouchableOpacity>
                ))}
            </View>
        );

      case 'carousel':
         return (
             <ScrollView key={key} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: 200, marginBottom: 16 }}>
                 {data.map((item, i) => (
                     <View key={i} style={{ width: Dimensions.get('window').width - 32, marginRight: 0 }}>
                         {config.itemTemplate && renderComponent(config.itemTemplate, item, i)}
                     </View>
                 ))}
             </ScrollView>
         );

      case 'card':
        return (
          <View key={key} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, config.props?.style]}>
             {config.children?.map((child, i) => renderComponent(child, contextData, i))}
          </View>
        );

      case 'input':
        const fieldKey = config.props?.name;
        return (
          <View key={key} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{config.props?.label}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder={config.props?.placeholder}
              placeholderTextColor={colors.subtle}
              value={formData[fieldKey] || ''}
              onChangeText={(text) => setFormData({...formData, [fieldKey]: text})}
            />
          </View>
        );
    }
    return null;
  };

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : (
        <ScrollView 
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          <Text style={[styles.header, { color: colors.text }]}>{schema.title}</Text>
          {renderComponent(schema.layout)}
        </ScrollView>
      )}

      {/* Generic Modal Renderer */}
      <Modal visible={!!activeModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingId ? 'Edit' : 'Create'}
            </Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContent}>
            {activeModal && schema.modals && schema.modals[activeModal] 
              ? renderComponent(schema.modals[activeModal]) 
              : <Text style={{color: colors.text}}>Modal content not found</Text>
            }
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16 },
  button: { padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  image: { width: '100%', height: 150, borderRadius: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  
  // Form Styles
  modalContainer: { flex: 1, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  formContent: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
});