import React from 'react';
import { View, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, AppButton, Icon, ClayView } from '@/src/components/ui';
import { ScreenTransition, AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { usePermission } from '@/src/context/PermissionContext';
import { useNewsAdminLogic } from '../hooks/useNewsAdminLogic';
import { NewsType } from '@/src/api/generatedClient';

const TypeBadge = ({ type, colors }: { type: string, colors: any }) => {
    let color = colors.primary;
    if (type === 'alert') color = colors.error;
    if (type === 'event') color = colors.tertiary;
    return (
        <View style={{ backgroundColor: color + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}>
            <AppText weight="bold" style={{ color: color, fontSize: 10, textTransform: 'uppercase' }}>{type}</AppText>
        </View>
    );
};

export default function NewsScreen() {
  const { colors } = useTheme();
  const { can } = usePermission();
  
  // 🚀 ALL LOGIC NOW COMES FROM THE HOOK
  const { 
      items, loading, refreshing, onRefresh,
      createModalVisible, setCreateModalVisible,
      newTitle, setNewTitle,
      newContent, setNewContent,
      newType, setNewType,
      editingId,
      handleOpenEdit,
      handlePost, 
      handleDelete
  } = useNewsAdminLogic();

  const router = useRouter();

  const renderItem = ({ item, index }: any) => (
    <AnimatedItem animation={ClayAnimations.SlideInFlow(index)}>
        <ClayView depth={5} puffy={10} color={colors.card} style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden' }}>
            {item.coverImageUrl && (
                <Image source={{ uri: item.coverImageUrl }} style={{ width: '100%', height: 160 }} />
            )}
            <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <TypeBadge type={item.type} colors={colors} />
                    <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </AppText>
                </View>
                <AppText variant="h3" weight="bold" style={{ color: colors.text, marginBottom: 8 }}>{item.title}</AppText>
                <AppText style={{ color: colors.text, lineHeight: 22, opacity: 0.9 }}>{item.content}</AppText>
            </View>
            
            {(can('news.create') || can('news.delete')) && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                    {can('news.create') ? (
                      <TouchableOpacity onPress={() => handleOpenEdit(item)} style={{ padding: 8 }}>
                        <Icon name="edit" size={20} color={colors.subtle} />
                      </TouchableOpacity>
                    ) : null}
                    {can('news.delete') ? (
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                        <Icon name="delete" size={20} color={colors.error} />
                      </TouchableOpacity>
                    ) : null}
                </View>
            )}
        </ClayView>
    </AnimatedItem>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTransition>
        <SafeAreaView style={{ flex: 1 }}>
          
          {/* HEADER */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 }}>
            <ClayBackButton />
            <AppText variant="h2" weight="bold" style={{ marginLeft: 16 }}>News & Alerts</AppText>
          </View>

          {/* LIST */}
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
                !loading ? (
                    <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <ClayView depth={5} puffy={10} color={colors.card} style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Icon name="campaign" size={40} color={colors.primary} />
                        </ClayView>
                        <AppText variant="h3" weight="bold">All caught up!</AppText>
                    </View>
                ) : <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            }
          />

          {/* FLOATING ACTION BUTTON */}
          {can('news.create') && (
            <View style={{ position: 'absolute', bottom: 30, right: 20 }}>
                <PressClay onPress={() => router.push('/news-create-article')}>
                    <ClayView depth={15} puffy={20} color={colors.primary} style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="add" size={30} color="#FFF" />
                    </ClayView>
                </PressClay>
            </View>
          )}

          {/* CREATE POST MODAL */}
          <Modal visible={createModalVisible} transparent animationType="slide">
             <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <ClayView depth={20} puffy={20} color={colors.card} style={{ padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' }}>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        {/* Note: I swapped 'primary' back to 'text' for Cancel to make it look like a standard iOS modal, but you can change it back! */}
                        <AppButton title="Cancel" variant="outline" size="sm" onPress={() => setCreateModalVisible(false)} />
                        <AppText variant="h3" weight="bold">
                            {editingId ? "Edit Post" : "New Post"}
                        </AppText>
                        <AppButton title="Post" size="sm" onPress={handlePost} disabled={!newTitle.trim()} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>Type</AppText>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                        {/* Extract the string names from the Enum dynamically */}
                        {Object.keys(NewsType)
                            .filter(key => isNaN(Number(key))) // Filters out the numeric values
                            .map(t => {
                                // NSwag enums are often numbers, so we parse it safely
                                const enumValue = NewsType[t as keyof typeof NewsType];
                                const isActive = newType === enumValue;

                                return (
                                    <TouchableOpacity key={t} onPress={() => setNewType(enumValue)}>
                                        <ClayView 
                                            depth={isActive ? 5 : 2} 
                                            puffy={10} 
                                            color={isActive ? colors.primary : colors.background} 
                                            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                                        >
                                            <AppText weight="bold" style={{ color: isActive ? '#FFF' : colors.text, textTransform: 'capitalize' }}>
                                                {t}
                                            </AppText>
                                        </ClayView>
                                    </TouchableOpacity>
                                );
                        })}
                    </View>

                        <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>Headline</AppText>
                        <ClayView depth={2} puffy={5} color={colors.background} style={{ borderRadius: 16, padding: 4, marginBottom: 24 }}>
                            <TextInput style={{ fontSize: 18, padding: 12, color: colors.text }} placeholder="What's happening?" placeholderTextColor={colors.subtle} value={newTitle} onChangeText={setNewTitle} />
                        </ClayView>

                        <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>Message</AppText>
                        <ClayView depth={2} puffy={5} color={colors.background} style={{ borderRadius: 16, padding: 4, marginBottom: 40 }}>
                            <TextInput style={{ fontSize: 16, padding: 12, color: colors.text, height: 150, textAlignVertical: 'top' }} placeholder="Provide the details..." placeholderTextColor={colors.subtle} multiline value={newContent} onChangeText={setNewContent} />
                        </ClayView>
                    </ScrollView>

                </ClayView>
             </View>
          </Modal>

        </SafeAreaView>
      </ScreenTransition>
    </View>
  );
}