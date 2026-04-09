import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { WS_BASE_URL } from '@/src/config/config'; 
import { CreateMessageRequest, MessageDto } from '@/src/api/generatedClient';
import { chatApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';

export const useChatLogic = () => {
  const { activeSession, token } = useAuth();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const ws = useRef<WebSocket | null>(null);

  const orgId = activeSession?.orgId;

  // 1. QUERY: Fetch Recent Messages
  const { data: pagedMessages } = useQuery({
    queryKey: QUERY_KEYS.chat.recent(orgId || ''),
    queryFn: async () => await unwrap(chatApi.getRecent(1, 100, orgId!)),
    enabled: !!orgId, // Don't fetch if no orgId
    staleTime: Infinity, // Rely on WS for updates
  });

  const messages = pagedMessages?.items || [];

  // 2. MUTATION: Send Message via API
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const request = new CreateMessageRequest({ content, userName: activeSession?.email }); // Send email or name
      return await unwrap(chatApi.send(orgId!, request));
    },
    onSuccess: () => {
       setInputText('');
       // We don't necessarily need to invalidate here because the WebSocket 
       // will broadcast the new message back to us anyway!
    }
  });

  // 3. WEBSOCKET: Real-time updates
  useEffect(() => {
    if (!orgId || !token) return;

    const url = `${WS_BASE_URL}/ws/organizations?orgId=${orgId}`;
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat_message') {
          // React Query Magic: Inject the new WS message directly into the cache!
          queryClient.setQueryData(QUERY_KEYS.chat.recent(orgId), (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: [...oldData.items, msg.data] // Append new message
            };
          });
        }
      } catch (e) { console.error("WS Parse Error", e); }
    };

    return () => ws.current?.close();
  }, [orgId, token, queryClient]);

  const handleSend = () => {
      if (!inputText.trim() || !orgId) return;
      sendMessageMutation.mutate(inputText);
  };

  return {
    messages,
    inputText,
    setInputText,
    handleSend,
    userId: activeSession?.email // Replace with real User ID if available in session
  };
};