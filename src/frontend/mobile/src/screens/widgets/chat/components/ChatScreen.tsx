import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { SplitPane } from '@/src/components/layout/SplitPane';
import { AppText, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors, useTabContentBottomPadding, useBreakpoint } from '@/src/hooks';
import { useChatLogic } from '../hooks/useChatLogic';
import { createChatStyles } from '../styles/chat.styles';
import { ChatChannelPanel } from './ChatChannelPanel';
import type { MessageDto } from '@/src/api/generatedClient';

export default function ChatScreen() {
  const colors = useThemeColors();
  const listBottomPad = useTabContentBottomPadding(32);
  const { isWideShell } = useBreakpoint();
  const { messages, inputText, setInputText, handleSend, userId } = useChatLogic();
  const flatListRef = useRef<FlatList<MessageDto>>(null);
  const styles = useMemo(() => createChatStyles(colors), [colors]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderItem = ({ item }: { item: MessageDto }) => {
    const isOwn = item.userId === userId;
    return (
      <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
        {!isOwn && item.userName ? (
          <AppText variant="caption" style={styles.senderName}>
            {item.userName}
          </AppText>
        ) : null}
        <AppText variant="body" style={isOwn ? styles.ownText : styles.otherText}>
          {item.content}
        </AppText>
      </View>
    );
  };

  const thread = (
    <View style={{ flex: 1 }}>
      <View style={styles.threadHeader}>
        <Icon name="chat" size={24} color={colors.primary} />
        <AppText variant="h3" weight="bold" style={{ marginLeft: 10, color: colors.text }}>
          Organization Chat
        </AppText>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(20, listBottomPad) }]}
        showsVerticalScrollIndicator={isWideShell}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (isWideShell ? 0 : 90) : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.subtle}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <PressClay onPress={inputText.trim() ? handleSend : undefined}>
            <View style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}>
              <Icon name="send" size={22} color="#fff" />
            </View>
          </PressClay>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageContainer>
        {isWideShell ? (
          <SplitPane sidebar={<ChatChannelPanel messages={messages} />}>{thread}</SplitPane>
        ) : (
          thread
        )}
      </PageContainer>
    </SafeAreaView>
  );
}
