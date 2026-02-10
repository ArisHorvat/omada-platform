import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { ChatService } from '@/src/services/ChatService';
import { Message } from '@/src/types/api';
import { WS_BASE_URL } from '@/src/config/config'; // Ensure this points to your backend (e.g. ws://10.0.2.2:5000)

export const useChatLogic = () => {
  const { activeSession, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const ws = useRef<WebSocket | null>(null);

  // 1. Load Initial Messages
  useEffect(() => {
    if (!activeSession?.orgId) return;

    const loadMessages = async () => {
        try {
            const history = await ChatService.getRecentMessages(activeSession.orgId);
            setMessages(history.reverse()); // Ensure chronological order
        } catch (e) {
            console.error("Failed to load chat history", e);
        }
    };
    loadMessages();
  }, [activeSession?.orgId]);

  // 2. Setup WebSocket
  useEffect(() => {
    if (!activeSession?.orgId || !token) return;

    // Connect to WS
    const url = `${WS_BASE_URL}/ws/organizations?orgId=${activeSession.orgId}`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
        console.log("Chat connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Assuming backend sends { type: 'chat_message', data: Message }
        if (msg.type === 'chat_message') {
          setMessages((prev) => [...prev, msg.data]);
        }
      } catch (e) { console.error("WS Parse Error", e); }
    };

    ws.current.onerror = (e) => {
        console.log("WS Error", e);
    };

    return () => {
      ws.current?.close();
    };
  }, [activeSession?.orgId, token]);

  const sendMessage = async () => {
      if (!inputText.trim() || !activeSession?.orgId) return;
      
      try {
          // Optimistic UI update could happen here, but usually safer to wait for WS echo or API ack
          await ChatService.sendMessage(inputText, activeSession.orgId);
          setInputText('');
      } catch (e) {
          console.error("Failed to send", e);
      }
  };

  return {
    messages,
    inputText,
    setInputText,
    sendMessage,
    currentUserId: activeSession?.email // Using email as a proxy for ID if ID isn't in session, or fetch User ID
  };
};