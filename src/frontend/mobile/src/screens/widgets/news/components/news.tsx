import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { createStyles } from '@/src/screens/widgets/news/styles/news.styles';
import { useNewsLogic } from '@/src/screens/widgets/news/hooks/useNewsLogic'; // The Facade
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';

// Helper for Type Badges
const TypeBadge = ({ type, colors }: { type: string, colors: any }) => {
    let color = colors.primary;
    if (type === 'alert') color = colors.error;
    if (type === 'event') color = colors.tertiary;
    return (
        <View style={{ backgroundColor: color + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' }}>
            <Text style={{ color: color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{type}</Text>
        </View>
    );
};

export default function NewsScreen() {
  const colors = useThemeColors();
  const { can } = usePermission();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  // ------------------------------------------------------
  // USE THE NEW FACADE HOOK
  // ------------------------------------------------------
  const { data, form, view } = useNewsLogic(); 

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => view.setSelected(item)}>
        {item.coverImageUrl && (
            <ProgressiveImage source={{ uri: item.coverImageUrl }} style={styles.cardImage} />
        )}
        <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
                <TypeBadge type={item.type} colors={colors} />
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.cardPreview}>{item.content}</Text>
        </View>
        
        {/* Admin Actions */}
        {can('news.create') && (
             <View style={styles.adminRow}>
                <TouchableOpacity onPress={() => form.actions.openEdit(item)} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={18} color={colors.subtle} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => data.delete(item.id)} style={styles.iconBtn}>
                    <MaterialIcons name="delete" size={18} color={colors.error} />
                </TouchableOpacity>
             </View>
        )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 1. LIST VIEW */}
      <FlatList
        data={data.items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={data.onRefresh} />}
        ListEmptyComponent={
            !data.loading ? <Text style={styles.emptyText}>No news yet.</Text> : <ActivityIndicator style={{ marginTop: 20 }} />
        }
      />

      {/* 2. FAB (Floating Action Button) */}
      {can('news.create') && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={form.actions.openCreate}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 3. CREATE / EDIT MODAL */}
      <Modal visible={form.visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{form.editingId ? 'Edit Post' : 'New Post'}</Text>
            <TouchableOpacity onPress={() => form.setVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput 
                style={styles.input} 
                value={form.values.title} 
                onChangeText={form.values.setTitle} 
                placeholder="Enter title..." 
                placeholderTextColor={colors.subtle}
            />

            {/* Type Selector (Simplified for brevity) */}
            <Text style={styles.label}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                {['announcement', 'alert', 'event'].map(t => (
                    <TouchableOpacity 
                        key={t} 
                        style={[styles.typeChip, form.values.type === t && { backgroundColor: colors.primary }]}
                        onPress={() => form.values.setType(t as any)}
                    >
                        <Text style={{ color: form.values.type === t ? '#fff' : colors.text }}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <Text style={styles.label}>Content</Text>
            <TextInput 
                style={[styles.input, { height: 120 }]} 
                value={form.values.content} 
                onChangeText={form.values.setContent} 
                placeholder="Write your update..." 
                multiline 
                placeholderTextColor={colors.subtle}
            />

            {/* Attachments UI */}
            <TouchableOpacity style={styles.attachBtn} onPress={() => form.actions.pickImage(true)}>
                <MaterialIcons name="image" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 8 }}>{form.values.coverPhoto ? 'Change Cover' : 'Add Cover Photo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.primary }]} 
              onPress={form.actions.submit}
              disabled={form.isPosting}
            >
              {form.isPosting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. VIEW ARTICLE MODAL */}
      <Modal visible={!!view.selected} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ padding: 20 }}>
                <TouchableOpacity onPress={view.close} style={{ marginBottom: 20 }}>
                     <MaterialIcons name="close" size={30} color={colors.text} />
                </TouchableOpacity>
                {view.selected && (
                    <ScrollView>
                        {view.selected.coverImageUrl && (
                             <Image source={{ uri: view.selected.coverImageUrl }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 20 }} />
                        )}
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>{view.selected.title}</Text>
                        <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{view.selected.content}</Text>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}