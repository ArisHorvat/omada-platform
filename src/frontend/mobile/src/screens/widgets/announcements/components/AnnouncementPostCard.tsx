import React, { useState } from 'react';

import { View, Pressable, ActivityIndicator } from 'react-native';



import { AppText, ClayView, Icon } from '@/src/components/ui';

import { PressClay } from '@/src/components/animations/PressClay';

import { useThemeColors } from '@/src/hooks';

import type { AnnouncementPostDto } from '@/src/api/announcementsApi';

import { useAnnouncementComments } from '../hooks/useAnnouncementComments';

import { createAnnouncementsStyles } from '../styles/announcements.styles';

import { AnnouncementTextField } from './AnnouncementTextField';



interface AnnouncementPostCardProps {

  post: AnnouncementPostDto;

  expanded: boolean;

  onToggle: () => void;

  orgId: string;

}



export function AnnouncementPostCard({ post, expanded, onToggle, orgId }: AnnouncementPostCardProps) {

  const colors = useThemeColors();

  const styles = createAnnouncementsStyles(colors);

  const [commentText, setCommentText] = useState('');

  const channelId = post.channelId ?? '';



  const { comments, isLoading, addComment, isAdding } = useAnnouncementComments(

    post.id!,

    channelId,

    orgId,

    expanded,

  );



  const commentCount = Math.max(post.commentCount ?? 0, comments.length);



  const submitComment = async () => {

    const text = commentText.trim();

    if (!text || isAdding) return;

    await addComment(text);

    setCommentText('');

  };



  return (

    <ClayView depth={8} puffy={0} color={colors.card} style={styles.postCard}>

      <AppText variant="h3" weight="bold" style={styles.postTitle}>

        {post.title || 'Announcement'}

      </AppText>

      <AppText variant="caption" style={styles.postMeta}>

        {post.authorName} · {new Date(post.createdAt!).toLocaleString()}

      </AppText>

      <AppText variant="body" style={styles.postBody}>

        {post.content}

      </AppText>



      <Pressable onPress={onToggle} style={styles.commentsToggle}>

        <Icon name="chat-bubble-outline" size={18} color={colors.primary} />

        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginLeft: 6 }}>

          {expanded ? 'Hide comments' : `Comments (${commentCount})`}

        </AppText>

      </Pressable>



      {expanded ? (

        <View style={styles.commentsBlock}>

          {isLoading ? (

            <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />

          ) : comments.length === 0 ? (

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>

              No comments yet. Start the conversation.

            </AppText>

          ) : (

            comments.map((c) => (

              <ClayView

                key={c.id}

                depth={4}

                puffy={0}

                color={colors.background}

                style={styles.commentRow}

              >

                <AppText variant="caption" weight="bold" style={{ color: colors.text }}>

                  {c.authorName}

                </AppText>

                <AppText variant="body" style={{ color: colors.text, marginTop: 4 }}>

                  {c.content}

                </AppText>

              </ClayView>

            ))

          )}



          <View style={styles.commentInputRow}>

            <View style={{ flex: 1 }}>

              <AnnouncementTextField

                value={commentText}

                onChangeText={setCommentText}

                placeholder="Write a comment…"

                multiline

                minHeight={44}

              />

            </View>

            <PressClay onPress={commentText.trim() && !isAdding ? submitComment : undefined}>

              <View style={[styles.commentSend, !commentText.trim() && styles.sendButtonDisabled]}>

                <Icon name="send" size={18} color="#fff" />

              </View>

            </PressClay>

          </View>

        </View>

      ) : null}

    </ClayView>

  );

}

