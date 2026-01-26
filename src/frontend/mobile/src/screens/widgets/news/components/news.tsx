import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { usePermission } from '@/src/context/PermissionContext';
import * as Linking from 'expo-linking';
import { createStyles } from '@/src/screens/widgets/news/styles/news.styles';
import { useNewsLogic, NewsItem } from '@/src/screens/widgets/news/hooks/useNewsLogic';

export default function NewsScreen() {
  const colors = useThemeColors();
  const { can } = usePermission();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { 
    news, loading, refreshing, handleRefresh, modalVisible, setModalVisible, 
    newTitle, setNewTitle, newContent, setNewContent, newType, setNewType, 
    isPosting, tempAttachments, coverPhoto, editingId, selectedArticle, setSelectedArticle, 
    isPreviewing, setIsPreviewing, handleAddAttachment, handlePickImage, removeAttachment, 
    removeCoverPhoto, openCreateModal, openEditModal, handleSavePost, handleDelete 
  } = useNewsLogic();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'alert': return colors.notification;
      case 'event': return colors.tertiary;
      case 'info': return colors.secondary;
      default: return colors.primary;
    }
  };

  // Helper to get cover image source for rendering
  const getCoverSource = (item: NewsItem) => {
    if (item.coverImageUrl) return { uri: item.coverImageUrl };
    // Fallback logic if no explicit cover but has images
    const img = item.attachments?.find(a => a.type.startsWith('image/'));
    return img ? { uri: img.url } : null;
  };

  // Preview Data Construction
  const previewItem: NewsItem = {
      id: 'preview',
      title: newTitle || 'Post Title',
      content: newContent || 'Post content preview...',
      type: newType,
      createdAt: new Date().toISOString(),
      attachments: coverPhoto ? [coverPhoto, ...tempAttachments] : tempAttachments,
      coverImageUrl: coverPhoto?.url
  };

  const renderCard = (item: NewsItem, onPress: () => void, onImagePress?: () => void) => {
    const coverSource = getCoverSource(item);
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {coverSource && (
            <TouchableOpacity onPress={onImagePress} disabled={!onImagePress} activeOpacity={0.9}>
                <Image 
                    source={coverSource} 
                    style={styles.cardImage} 
                    resizeMode="cover"
                />
                {onImagePress && (
                    <View style={styles.editOverlay}>
                        <MaterialIcons name="crop" size={20} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
            )}
            <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
                <View style={[styles.tag, { backgroundColor: getIconColor(item.type) + '15' }]}>
                    <Text style={[styles.tagText, { color: getIconColor(item.type) }]}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={[styles.date, { color: colors.subtle }]}>{formatTime(item.createdAt)}</Text>
                {item.id !== 'preview' && can('news.delete') && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 'auto', padding: 4 }}>
                    <MaterialIcons name="delete-outline" size={20} color={colors.subtle} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text numberOfLines={3} style={[styles.content, { color: colors.subtle }]}>{item.content}</Text>
            {item.attachments && item.attachments.length > (coverSource ? 1 : 0) && (
                <View style={styles.attachmentBadge}>
                <MaterialIcons name="attach-file" size={14} color={colors.subtle} />
                <Text style={{ color: colors.subtle, fontSize: 12, marginLeft: 4 }}>
                    {item.attachments.length - (coverSource ? 1 : 0)} more attachment(s)
                </Text>
                </View>
            )}
            </View>
        </TouchableOpacity>
    );
  };

  const renderArticleContent = (item: NewsItem, onImagePress?: () => void) => {
      const coverSource = getCoverSource(item);
      return (
        <ScrollView style={{ flex: 1 }}>
            {coverSource && (
                <TouchableOpacity onPress={onImagePress} disabled={!onImagePress} activeOpacity={0.9}>
                    <Image 
                    source={coverSource} 
                    style={styles.articleImage} 
                    resizeMode="contain"
                    />
                    {onImagePress && (
                        <View style={styles.editOverlay}>
                            <MaterialIcons name="crop" size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            )}
            <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.tag, { backgroundColor: getIconColor(item.type) + '15' }]}>
                        <Text style={[styles.tagText, { color: getIconColor(item.type) }]}>{item.type.toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: colors.subtle }}>{formatTime(item.createdAt)}</Text>
                </View>

                <Text style={[styles.articleTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.articleContent, { color: colors.text }]}>{item.content}</Text>
                {item.attachments && item.attachments.length > 0 && (
                    <View style={styles.attachmentsSection}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Attachments</Text>
                        {item.attachments.map((file, idx) => (
                            <TouchableOpacity 
                                key={idx} 
                                onPress={() => Linking.openURL(file.url)} 
                                style={[styles.attachmentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                {file.type.startsWith('image/') ? (
                                    <Image source={{ uri: file.url }} style={styles.attachmentThumb} />
                                ) : (
                                    <View style={[styles.attachmentIcon, { backgroundColor: colors.background }]}>
                                        <MaterialIcons name="description" size={24} color={colors.primary} />
                                    </View>
                                )}
                                <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                                <MaterialIcons name="download" size={20} color={colors.subtle} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
      );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>Latest News</Text>
        {can('news.create') && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
            onPress={openCreateModal}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <FlatList
        data={news}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.subtle, marginTop: 40 }}>No news yet.</Text>
        }
        renderItem={({ item }) => renderCard(item, () => setSelectedArticle(item))}
      />
      )}

      {/* Create/Edit Post Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingId ? 'Edit Post' : 'New Post'}</Text>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setIsPreviewing(!isPreviewing)}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{isPreviewing ? 'Edit' : 'Preview'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setModalVisible(false); setIsPreviewing(false); }}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
          </View>
          
          {isPreviewing ? (
            <View style={{ flex: 1 }}>
                {renderArticleContent(previewItem, handlePickImage)}
            </View>
          ) : (
            <ScrollView style={styles.form}>
            {/* Live Card Preview */}
            <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>Card Preview (Tap photo to crop)</Text>
            <View>
                {renderCard(previewItem, () => {}, handlePickImage)}
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Cover Photo</Text>
            {coverPhoto ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: colors.card, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.primary }}>
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                    <Text style={{ color: colors.text, marginLeft: 12, flex: 1, fontWeight: '600' }}>Cover Photo Added</Text>
                    
                    <TouchableOpacity onPress={handlePickImage} style={{ marginRight: 16 }}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Change</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={removeCoverPhoto}>
                        <MaterialIcons name="delete-outline" size={24} color={colors.subtle} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity onPress={handlePickImage} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: colors.card, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center' }}>
                    <MaterialIcons name="add-photo-alternate" size={24} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 8 }}>Add Cover Photo</Text>
                </TouchableOpacity>
            )}

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Title</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Campus Closed"
              placeholderTextColor={colors.subtle}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>Type</Text>
            <View style={styles.typeRow}>
              {(['announcement', 'alert', 'event', 'info'] as const).map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[
                    styles.typeChip, 
                    { borderColor: colors.border },
                    newType === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[
                    styles.typeText, 
                    { color: colors.text },
                    newType === t && { color: '#fff', fontWeight: 'bold' }
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Content</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Write your message here..."
              placeholderTextColor={colors.subtle}
              multiline
              value={newContent}
              onChangeText={setNewContent}
            />

            <View style={{ marginBottom: 20 }}>
              <TouchableOpacity onPress={handleAddAttachment} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="attach-file" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 8 }}>Attach Documents</Text>
              </TouchableOpacity>
              
              {tempAttachments.map((file, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: 8, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                    {file.name}
                  </Text>
                  
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <MaterialIcons name="close" size={16} color={colors.subtle} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.primary }]} 
              onPress={handleSavePost}
              disabled={isPosting}
            >
              {isPosting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{editingId ? 'Save Changes' : 'Post News'}</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
          )}
        </View>
      </Modal>

      {/* Article Detail Modal */}
      <Modal visible={!!selectedArticle} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: 16 }]}>Article</Text>
            {can('news.create') && (
              <TouchableOpacity onPress={() => selectedArticle && openEditModal(selectedArticle)} style={{ marginRight: 16, marginLeft: 'auto' }}>
                <MaterialIcons name="edit" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setSelectedArticle(null)}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {selectedArticle && renderArticleContent(selectedArticle)}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
