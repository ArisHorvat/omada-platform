import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';
import { useChatLogic } from '../hooks/useChatLogic';

export default function ChatScreen() {
  const colors = useThemeColors();
  const { messages, inputText, setInputText, handleSend, userId } = useChatLogic();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 8 },
    listContent: { padding: 16, paddingBottom: 20 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
    ownMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    otherMessage: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
    messageText: { fontSize: 16 },
    ownText: { color: '#fff' },
    otherText: { color: colors.text },
    senderName: { fontSize: 12, color: colors.subtle, marginBottom: 4 },
    inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
    input: { flex: 1, backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: colors.text, maxHeight: 100 },
    sendButton: { marginLeft: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  }), [colors]);

  const renderItem = ({ item }: { item: any }) => {
    const isOwn = item.userId === userId;
    return (
      <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
        {!isOwn && <Text style={styles.senderName}>{item.userName}</Text>}
        <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <MaterialIcons name="chat" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Organization Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.subtle}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!inputText.trim()}>
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
